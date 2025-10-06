import Link from "next/link";

// to call inviteUser when inviting user

export default async function Users(){
  const res = await fetch("https://jsonplaceholder.typicode.com/users");
  const users = await res.json();
  
    return (
    <div>
        {" "}
        <h1>Click on the names to view their details</h1>
        <ul>
            {users.map((user: {id : number; name: string}) => (
                <li key={user.id}><Link href={`/users/${user.id}`}>
                <h3>{user.name}</h3>
                </Link>
                </li>
            ))}
        </ul>{" "}
    </div>

    );
}