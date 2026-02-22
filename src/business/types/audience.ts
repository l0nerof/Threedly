import { audiences } from "../constants/audiences";

export type AudienceId = (typeof audiences)[number]["id"];
