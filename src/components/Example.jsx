import React from "react"
import ReactDOM from "react-dom/client"
import {
  QueryClient,
  QueryClientProvider,
  useQuery
} from "@tanstack/react-query"
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools"

// const queryClient = new QueryClient()

// export default function ExampleApp() {
//   return (
//     <QueryClientProvider client={queryClient}>
//       <ReactQueryDevtools />
//       <Example />
//     </QueryClientProvider>
//   )
// }

export function Example() {
  const { isPending, error, data, isFetching } = useQuery({
    queryKey: ["repoData"],
    queryFn: async () => {
      const response = await fetch(
        "http://localhost:3000/lists/a4390223-9035-4d1f-addb-5b222e8bbd6b"
      )
      return await response.json()
    }
  })

  if (isPending) return "Loading..."

  if (error) return "An error has occurred: " + error.message

  return (
    <div>
      <h1>{data.name}</h1>
      <p>{data.id}</p>
      <p>User ID: {data.user_id}</p>
      <p>Created At: {data.created_at}</p>
      <p>Updated At: {data.updated_at}</p>
      <p>Pinned: {data.pinned ? "Yes" : "No"}</p>
      <h2>User Information</h2>
      <p>User ID: {data.user.id}</p>
      <p>Email: {data.user.email}</p>
      <h2>List Items</h2>
      <ul>
        {data.list_items.map(item => (
          <li key={item.id}>
            Item ID: {item.id}, Name: {item.name || "No Name"}, Done: {item.done ? "Yes" : "No"}
          </li>
        ))}
      </ul>

      <div>{isFetching ? "Updating..." : ""}</div>
    </div>
  )
}
