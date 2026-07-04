"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/api";

export default function Register() {

  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {

    try {

      const response = await fetch(
        apiUrl("/api/auth/signup"),
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            username,
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      alert(data.message);

      // after successful registration
      // send user to login page
      router.push("/login");

    } catch (error) {

      console.log(error);

    }

  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center gap-4">

      <h1 className="text-3xl font-bold">
        Register
      </h1>

      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="border p-2 rounded w-[300px]"
      />

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2 rounded w-[300px]"
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border p-2 rounded w-[300px]"
      />

      <button
        onClick={handleRegister}
        className="bg-black text-white px-4 py-2 rounded"
      >
        Register
      </button>

    </div>
  );
}