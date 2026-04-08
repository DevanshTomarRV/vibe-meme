export const VIDEO_MAP: Record<number, { url: string; title: string }> = {
  1: { url: "https://www.youtube.com/embed/GPLJVitGsso?autoplay=1&mute=1", title: "Pooja, What is this behavior?" },
  2: { url: "https://www.youtube.com/embed/-3_IuPMya6k?autoplay=1&mute=1", title: "I'm Tired Boss" },
  3: { url: "https://www.youtube.com/embed/0oBx7Jg4m-o?autoplay=1&mute=1", title: "This Is Fine" },
  4: { url: "https://www.youtube.com/embed/jxdTwLvECAA?autoplay=1&mute=1&start=80", title: "Pedro Pascal Laughing Then Crying" },
  5: { url: "https://www.youtube.com/embed/ywgeloPNmxk?autoplay=1&mute=1", title: "Gopi Bahu Laptop Washing" },
};

export function getMemeUrl(rating: number): string {
  return VIDEO_MAP[rating]?.url ?? VIDEO_MAP[3].url;
}
