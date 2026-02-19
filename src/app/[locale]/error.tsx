"use client";

import ErrorPage from "../../business/components/ErrorPage";

type Props = {
  error: Error & { digest?: string };
};

export default function Error({ error }: Props) {
  console.error(error);

  return <ErrorPage />;
}
