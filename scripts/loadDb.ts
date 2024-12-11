import { DataAPIClient } from "@datastax/astra-db-ts";
import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer";
import OpenAI from "openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import "dotenv/config";

// Define valid similarity metrics for vector search
type SimilarityMetric = "dot_product" | "cosine" | "euclidean";

// Interface for site-specific scraping configuration
interface SiteConfig {
    contentSelector: string;
    waitForSelector: string;
    removeSelectors: string[];
}

// Load environment variables
const {
    ASTRA_DB_NAMESPACE,
    ASTRA_DB_COLLECTION,
    ASTRA_DB_API_ENDPOINT,
    ASTRA_DB_APPLICATION_TOKEN,
    OPENAI_API_KEY,
} = process.env;

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// URLs for scraping F1 data
const f1Data = [
    "https://en.wikipedia.org/wiki/Formula_One",
    "https://www.skysports.com/f1",
    "https://www.formula1.com/",
    "https://www.espn.com/f1/",
];

// Initialize AstraDB client and database connection
const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN as string);
const db = client.db(ASTRA_DB_API_ENDPOINT as string, { namespace: ASTRA_DB_NAMESPACE as string });

// Configure text splitter
const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 512,
    chunkOverlap: 50,
});

/**
 * Get site-specific scraping configuration based on the URL.
 */
const getSiteSpecificConfig = (url: string): SiteConfig => {
    if (url.includes("wikipedia.org")) {
        return {
            contentSelector: "#mw-content-text",
            waitForSelector: "#mw-content-text",
            removeSelectors: ["#mw-navigation", ".mw-jump-link", ".reference", ".mw-editsection"],
        };
    }
    if (url.includes("formula1.com")) {
        return {
            contentSelector: ".f1-article__content",
            waitForSelector: ".f1-article__content",
            removeSelectors: [".f1-social-links", ".f1-promotional"],
        };
    }
    if (url.includes("skysports.com")) {
        return {
            contentSelector: ".sdc-article-body",
            waitForSelector: ".sdc-article-body",
            removeSelectors: [".sdc-article-share", ".sdc-article-widget"],
        };
    }
    if (url.includes("espn.com")) {
        return {
            contentSelector: "main, #content, .article-content",
            waitForSelector: "body",
            removeSelectors: ["script", "style", "nav", "footer", "header"],
        };
    }
    return {
        contentSelector: "main, #content, .article-content",
        waitForSelector: "body",
        removeSelectors: ["script", "style", "nav", "footer", "header"],
    };
};

/**
 * Retry mechanism for API calls with exponential backoff.
 */
const withRetry = async <T>(fn: () => Promise<T>, retries = 3): Promise<T> => {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            console.error(`Retry attempt ${i + 1} failed:`, error);
            if (i === retries - 1) throw error;
            await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, i)));
        }
    }
    throw new Error("Retry failed");
};

interface EmbeddingResponse {
    data: Array<{
        embedding: number[];
    }>;
}

/**
 * Generate embeddings for text chunks in batches.
 */
const batchEmbeddings = async (chunks: string[]) => {
    const batchSize = 10;
    const embeddings: Array<{ embedding: number[] }> = [];

    for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        const embedding = await withRetry<EmbeddingResponse>(() =>
            openai.embeddings.create({
                model: "text-embedding-ada-002",
                input: batch,
            })
        );
        embeddings.push(...embedding.data);
    }
    return embeddings;
};

interface Document {
    $vector: number[];
    text: string;
    source: string;
    timestamp: string;
}

/**
 * Insert documents into the database in batches.
 */
const batchInsert = async (collection: any, documents: Document[]) => {
    const batchSize = 20;
    for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        await collection.insertMany(batch);
    }
};

/**
 * Clean and filter scraped content.
 */
const filterContent = (content: string): string => {
    if (!content?.trim()) return "";

    // Normalize whitespace
    content = content.replace(/\s+/g, " ").trim();

    // Remove noise patterns
    content = content
        .replace(/cookie policy|accept cookies|privacy policy/gi, "")
        .replace(/advertisement|sponsored content/gi, "")
        .replace(/share this article|follow us/gi, "");

    // Filter out very short content
    return content.length >= 100 ? content : "";
};

/**
 * Create a vector collection if it doesn't exist.
 */
const createCollectionIfNotExists = async (similarityMetric: SimilarityMetric = "dot_product") => {
    try {
        const res = await db.createCollection(ASTRA_DB_COLLECTION as string, {
            vector: {
                dimension: 1536,
                metric: similarityMetric,
            },
        });
        console.log("Collection created:", res);
    } catch (error: any) {
        if (error.message.includes("already exists")) {
            console.log("Collection already exists, proceeding with data loading...");
        } else {
            throw error;
        }
    }
};

/**
 * Scrape content from a given URL using Puppeteer.
 */
const scrapePage = async (url: string): Promise<string> => {
    const config = getSiteSpecificConfig(url);

    try {
        const loader = new PuppeteerWebBaseLoader(url, {
            launchOptions: {
                headless: true,
                args: ["--no-sandbox", "--disable-setuid-sandbox"],
            },
            gotoOptions: {
                waitUntil: ["domcontentloaded", "networkidle0"],
                timeout: 60000,
            },
            async evaluate(page) {
                await page.waitForSelector(config.waitForSelector, { timeout: 30000 });

                // Scroll to trigger lazy-loaded content
                const scrollTimeout = 10000; // Max scroll duration in ms
                const startTime = Date.now();
                await page.evaluate(async () => {
                    const distance = 200;
                    const delay = 100;
                    while (Date.now() - startTime < scrollTimeout) {
                        window.scrollBy(0, distance);
                        await new Promise((resolve) => setTimeout(resolve, delay));
                    }
                });

                // Extract and clean content
                return await page.evaluate((config: SiteConfig) => {
                    config.removeSelectors.forEach((selector) => {
                        document.querySelectorAll(selector).forEach((el) => el.remove());
                    });

                    const mainContent = document.querySelector(config.contentSelector);
                    if (!(mainContent instanceof HTMLElement)) return "";
                    return mainContent.innerText.replace(/\s+/g, " ").trim();
                }, config);
            },
        });

        const content = await loader.load();
        return content[0]?.pageContent || "";
    } catch (error) {
        console.error(`Error scraping ${url}:`, error);
        return "";
    }
};

/**
 * Load F1 data into the database.
 */
const loadSampleData = async (): Promise<void> => {
    const collection = await db.collection(ASTRA_DB_COLLECTION as string);

    for (const url of f1Data) {
        console.log(`\nProcessing URL: ${url}`);
        try {
            const rawContent = await scrapePage(url);
            const content = filterContent(rawContent);
            if (content) {
                const chunks = await splitter.splitText(content);
                const embeddings = await batchEmbeddings(chunks);
                const documents: Document[] = chunks.map((chunk, index) => ({
                    $vector: embeddings[index].embedding,
                    text: chunk,
                    source: url,
                    timestamp: new Date().toISOString(),
                }));
                await batchInsert(collection, documents);
                console.log(`Inserted ${documents.length} documents for ${url}`);
            } else {
                console.log(`No valid content from ${url}`);
            }
        } catch (error) {
            console.error(`Error processing URL ${url}:`, error);
        }
    }
};

/**
 * Main execution function.
 */
const main = async (): Promise<void> => {
    try {
        await createCollectionIfNotExists();
        await loadSampleData();
        console.log("Data loading completed successfully.");
    } catch (error) {
        console.error("Error in main process:", error);
        process.exit(1);
    }
};

// Start the process
main();