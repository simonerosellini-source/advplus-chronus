import { redirect } from 'next/navigation';

// La root page reindirizza automaticamente a /login
export default function Home() {
  redirect('/login');
}
