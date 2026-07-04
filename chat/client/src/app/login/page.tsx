"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/api";

export default function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const handleLogin = async () => {

    try {

      const response = await fetch(
        apiUrl("/api/auth/login"),
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (data.token) {

  // save JWT token
  localStorage.setItem(
    "token",
    data.token
  );

  // save username
  localStorage.setItem(
    "username",
    data.username
  );

  // redirect to chat page
  router.push("/chat");
}

    } catch (error) {

      console.log(error);

    }

  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center gap-4">

      <h1 className="text-3xl font-bold">
        Login
      </h1>

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
        onClick={handleLogin}
        className="bg-black text-white px-4 py-2 rounded"
      >
        Login
      </button>

    </div>
  );
}