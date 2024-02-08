import { Schema, model } from "mongoose";

export type UserType = {
	name: string;
	email: string;
};

const userSchema = new Schema<UserType>({
	name: { type: String, required: true },
	email: { type: String, required: true },
});

export const User = model<UserType>("User", userSchema);
