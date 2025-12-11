"use client";

export default function Home() {
  async function signup() {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Kashan A",
        email: "test@gmail.comm",
        password: "1234a56",
      }),
    });
    console.log(await res.json());
  }

  async function login() {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@gmail.comm",
        password: "1234a56",
      }),
    });
    console.log(await res.json());
  }

  async function profile() {
    const res = await fetch("/api/profile", {
      credentials: "include",
    });
    console.log(await res.json());
  }

 async function logout() {
  const res = await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });

  console.log(await res.json());
}

  return (
    <div>
      <button onClick={signup}>Signup</button>
      <button onClick={login}>Login</button>
      <button onClick={profile}>Check Profile</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
