import ashleyPortrait from "../assets/ashley-portrait.webp";
import farmPortrait from "../assets/farm-portrait.webp";

export interface AboutPanel {
  title: string;
  text: string;
  image: string;
  alt: string;
  /** CSS object-position, so the crop keeps the subject in frame. */
  imagePosition: string;
}

// Shown side by side on wide screens, in this order.
export const ABOUT_PANELS: AboutPanel[] = [
  {
    title: "About Ashley",
    text: "Welcome Home Farm is the culmination of a lifelong vision of Ashley Harris, owner and operator. She studied native fruit production for years and believes in bringing native food and the harvesting experience back home to her community. She has a BS in Biology and is a proud 2025 graduate of the University of Arkansas CAFF (Center for Arkansas Food and Farming) program. Ashley attributes her ability to open Welcome Home Farm to her grandmothers’ love of gardening, her local farming support network, and her patient, supportive spouse, Ethan along with their five incredible kids.",
    image: ashleyPortrait,
    alt: "Ashley Harris smiling while harvesting in the garden",
    imagePosition: "center 20%",
  },
  {
    title: "About the Farm",
    text: "Welcome Home Farm launched on rented land in 2025, and found its permanent home in The Orchards neighborhood of Bentonville in 2026. We grow seasonal vegetables and 6 native fruits for U-Pick, CSA, and educational experiences for our community.",
    image: farmPortrait,
    alt: "Aerial view of the farm's planted rows, with someone waving from between them",
    imagePosition: "center 75%",
  },
];
