import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    verifiedEmail: {
      type: Boolean,
      default: false,
    },
    confirmationCode: {
      type: String,
    },
    password: {
      type: String,
      required: function () {
        return this.authProvider !== "google";
      },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    bio: {
      type: String,
      default: "",
    },
    profileImage: {
      type: String,
      default:
        "https://res.cloudinary.com/dkhosxear/image/upload/v1735048989/Captura_de_tela_2024-12-24_105753_ltu7jz.png",
    },
    chatBackground: {
      type: String,
      default: "",
    },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], 
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], 
  },
  { strict: true },
);

userSchema.pre("save", async function (next) {
  // Só hashear se a senha foi modificada ou criada
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10); // Número de rounds para o salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model("User", userSchema);
