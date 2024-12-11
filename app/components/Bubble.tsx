interface BubbleProps {
    message: {
        content: string;
        role: "user" | "assistant" | "system" | "data";
    }
}

export default function Bubble({ message }: BubbleProps) {
    // Your bubble component implementation
    return (
        <div className={`bubble ${message.role}`}>
            {message.content}
        </div>
    );
}