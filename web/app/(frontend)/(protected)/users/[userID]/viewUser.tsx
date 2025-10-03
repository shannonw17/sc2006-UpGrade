// app/users/[id]/page.tsx
interface UserPageProps {
  params: { id: string };
}

export default async function UserPage({ params }: UserPageProps) {
  const res = await fetch(
    `https://jsonplaceholder.typicode.com/users/${params.id}`
  );
  const user = await res.json();

  return (
    <div>
      <h1>{user.name}</h1>
      <p>Email: {user.email}</p>
      <p>Username: {user.username}</p>
      <p>Website: {user.website}</p>
    </div>
  );
}
