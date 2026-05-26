import SessionJoinPage from "./components/SessionJoinPage";

export async function generateStaticParams() {
  return [{ code: 'placeholder' }];
}

export default function Page() {
  return <SessionJoinPage />;
}