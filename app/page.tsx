// page.tsx
"use client"

import { useEffect, useState } from "react"
import { Message } from "ai"
import Image from "next/image"
import { useChat } from "ai/react"
import f1GPTLogo from "./asset/f1gpt.png"
import Bubble from "./components/Bubble"
import LoadingBubble from "./components/LoadingBubble"
import PromptSuggestionRow from "./components/PromptSuggestionsRow"

export default function Page() {
    const [isMounted, setIsMounted] = useState(false)
    const { 
        append, 
        isLoading, 
        messages, 
        input, 
        handleInputChange, 
        handleSubmit, 
        error 
    } = useChat({
        api: '/api/chat',
        onError: (error) => {
            console.error('Chat error:', error);
        },
        onFinish: (message) => {
            console.log('Finished message:', message);
        },
    })
    
    const noMessage = !messages || messages.length === 0

    useEffect(() => {
        setIsMounted(true)
    }, [])

    const handlePromptClick = async (promptText: string) => {
        try {
            await append({
                content: promptText,
                role: 'user',
            });
        } catch (error) {
            console.error('Error in handlePromptClick:', error);
        }
    }

    if (!isMounted) {
        return null
    }

    return (
        <main>
            <Image src={f1GPTLogo} width={250} alt="F1GPT Logo"/>
            <section className={noMessage ? "" : "populated"}>
                {noMessage ? (
                    <>
                        <p className="starter-text">
                            Ask F1GPT for anything!
                        </p>
                        <br/>
                        <PromptSuggestionRow onPromptClick={handlePromptClick}/>
                    </>
                ) : (
                    <>
                        {messages.map((message, index) => (
                            <Bubble 
                                key={index}
                                message={{
                                    content: message.content,
                                    role: message.role as "user" | "assistant"
                                }}
                            />
                        ))}
                        {isLoading && <LoadingBubble/>}
                        {error && (
                            <div className="error-message">
                                An error occurred. Please try again.
                            </div>
                        )}
                    </>
                )}
            </section>
            <form onSubmit={handleSubmit}>
                <input 
                    className="question-box" 
                    onChange={handleInputChange} 
                    value={input} 
                    placeholder="Ask me something"
                    type="text"
                />
                <input 
                    type="submit" 
                    disabled={isLoading}
                    value="Send"
                />
            </form>
        </main>
    )
}