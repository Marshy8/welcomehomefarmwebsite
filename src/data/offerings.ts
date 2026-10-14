import type { CsaSeasonId, Offering } from "../types";

/** The CSA seasons, in the order the card lists them. */
export const CSA_SEASONS: { id: CsaSeasonId; name: string }[] = [
  { id: "spring", name: "Spring " },
  { id: "summer", name: "Summer" },
];

// TODO: placeholder copy. Replace with the farm's own wording.
export const OFFERINGS: Offering[] = [
  {
    id: "csa",
    title: "Join the U-Pick CSA",
    description:
      "CSA stands for community supported agriculture. At our farm you do more than just pick up a basket, you pick it yourself.",
    includes: [
      "Members get 8 produce baskets over 8 weeks",
      "10+ seasonal fruits and veggies for both seasons.",
      "$200",
    ],
  },
  {
    id: "mailing",
    title: "Join the mailing list",
    description: "Leave your email and hear from the farm.",
    includes: [
      "Be the first to know when berries are ready for picking",
      "Receive updates on discounts when production is high",
      "Calendar updates for our festivals and special events",
    ],
    cta: "Join the list",
  },
  {
    id: "event",
    title: "Schedule a group event",
    description: "Bring your group out to the farm.",
    includes: [
      "Private guided pickings for groups",
      "Rent the lush farm for intimate events",
      "Weddings, social gatherings, birthdays, etc.",
      "$25 deposit for reservation (hourly rates dependent)",
    ],
    note: "Send us a message below with your group size, activity, and the dates you have in mind.",
    cta: "Message the farm",
  },
];
