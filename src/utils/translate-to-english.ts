import { OpenAI } from "openai";
import { OPENAI_API_KEY } from "./security/keys";

const openAIClient = new OpenAI({
    apiKey: OPENAI_API_KEY,
});

export const translateToEnglish = async (text: string): Promise<{ englishText: string, language: string }> => {
    try{
        const response = await openAIClient.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are a translation assistant that detects the input language and translates it into English.",
                },
                {
                    role: "user",
                    content: `Detect the language of this sentence and translate it to English. Return JSON only:
                {"language": "<detected_language>", "englishText": "<english_translation>"}
                
                Sentence: "${text}"`,
                },
            ],
        });

        const raw = response.choices[0].message?.content || "{}";
        const cleaned = raw
            .replace(/```json\s*/g, "")
            .replace(/```/g, "")
            .trim();
        console.log("cleaned text: ", cleaned);
        const parsedText = JSON.parse(cleaned);
        return parsedText;
    } catch(error) {
        console.error("Translation failed: ", error);
        return { englishText: text, language: "unknown"};
    }
}; 