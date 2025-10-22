const cropSynonyms: Record<string, string> = {
    rice: "rice",
    paddy: "rice",
    akki: "rice",
    chawal: "rice",
    dhan: "rice",
    wheat: "wheat",
    godhi: "wheat",
    corn: "maize",
    maize: "maize",
    jowar: "sorghum",
    ragi: "finger millet",
};

export function normalizeCropName(name: string): string {
    const normalized = name.trim().toLowerCase();
    return cropSynonyms[normalized] || normalized;
}