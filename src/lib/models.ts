import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  username: string;
  passwordHash: string;
  displayName: string;
  role: "USER" | "ADMIN";
  rollsLeft: number;
  totalRolls: number;
  pityCounter: number;
  points: number;
  lastDailyClaim?: Date;
  lastRollRegenTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICard extends Document {
  title: string;
  imageUrl: string;
  rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY" | "MYTHIC" | "SECRET";
  description: string;
  album: string;
  createdAt: Date;
}

export interface IUserCard extends Document {
  userId: mongoose.Types.ObjectId;
  cardId: mongoose.Types.ObjectId;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMission extends Document {
  title: string;
  description: string;
  type: "DAILY" | "ACHIEVEMENT";
  target: number;
  rewardRolls: number;
  key: string;
}

export interface IUserMission extends Document {
  userId: mongoose.Types.ObjectId;
  missionId: mongoose.Types.ObjectId;
  progress: number;
  completed: boolean;
  claimed: boolean;
  lastUpdated: Date;
}

export interface IRedemption extends Document {
  userId: mongoose.Types.ObjectId;
  giftId: string;
  giftName: string;
  pointsSpent: number;
  status: "PENDING" | "COMPLETED";
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    displayName: { type: String, required: true },
    role: { type: String, enum: ["USER", "ADMIN"], default: "USER" },
    rollsLeft: { type: Number, default: 10 },
    totalRolls: { type: Number, default: 0 },
    pityCounter: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    lastDailyClaim: { type: Date },
    lastRollRegenTime: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const CardSchema = new Schema<ICard>(
  {
    title: { type: String, required: true },
    imageUrl: { type: String, required: true },
    rarity: {
      type: String,
      enum: ["COMMON", "RARE", "EPIC", "LEGENDARY", "MYTHIC", "SECRET"],
      required: true,
      index: true,
    },
    description: { type: String, default: "" },
    album: { type: String, required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const UserCardSchema = new Schema<IUserCard>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    cardId: { type: Schema.Types.ObjectId, ref: "Card", required: true, index: true },
    quantity: { type: Number, default: 1 },
  },
  { timestamps: true }
);
UserCardSchema.index({ userId: 1, cardId: 1 }, { unique: true });

const MissionSchema = new Schema<IMission>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, enum: ["DAILY", "ACHIEVEMENT"], required: true, index: true },
  target: { type: Number, required: true },
  rewardRolls: { type: Number, required: true },
  key: { type: String, required: true, unique: true },
});

const UserMissionSchema = new Schema<IUserMission>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  missionId: { type: Schema.Types.ObjectId, ref: "Mission", required: true, index: true },
  progress: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  claimed: { type: Boolean, default: false },
  lastUpdated: { type: Date, default: Date.now },
});
UserMissionSchema.index({ userId: 1, missionId: 1 }, { unique: true });

const RedemptionSchema = new Schema<IRedemption>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    giftId: { type: String, required: true },
    giftName: { type: String, required: true },
    pointsSpent: { type: Number, required: true },
    status: { type: String, enum: ["PENDING", "COMPLETED"], default: "PENDING", index: true },
  },
  { timestamps: true }
);

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export const Card: Model<ICard> = mongoose.models.Card || mongoose.model<ICard>("Card", CardSchema);
export const UserCard: Model<IUserCard> = mongoose.models.UserCard || mongoose.model<IUserCard>("UserCard", UserCardSchema);
export const Mission: Model<IMission> = mongoose.models.Mission || mongoose.model<IMission>("Mission", MissionSchema);
export const UserMission: Model<IUserMission> = mongoose.models.UserMission || mongoose.model<IUserMission>("UserMission", UserMissionSchema);
export const Redemption: Model<IRedemption> = mongoose.models.Redemption || mongoose.model<IRedemption>("Redemption", RedemptionSchema);
