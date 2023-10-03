"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { format } from "date-fns";
import { useIntersection } from "@mantine/hooks";
import { useInfiniteQuery } from "@tanstack/react-query";

import { cn } from "@/lib/utils";
import { CurrencyType } from "@/types";
import { Miscellaneous } from "@/db/schema";
import { MiscEditEntry } from "@/components/misc/misc-edit";
import { MiscDeleteEntry } from "@/components/misc/misc-delete";
import { INFINITE_SCROLLING_PAGINATION_RESULTS } from "@/config";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { MiscEntryItemSkeleton } from "@/components/skeletons/infinite-cards";

const MiscCard = ({
  initialBalance,
  initialMiscEntries,
  currency,
}: {
  initialMiscEntries: Miscellaneous[];
  currency: CurrencyType;
  initialBalance: number;
}) => {
  const lastEntryRef = useRef<HTMLElement>(null);
  const [miscEntries, setMiscEntries] = useState(initialMiscEntries);

  const [noNewData, setNoNewData] = useState(false);

  const { ref, entry } = useIntersection({
    root: lastEntryRef.current,
    threshold: 1,
  });

  const { data, fetchNextPage, isFetchingNextPage, isFetching } =
    useInfiniteQuery(
      ["miscellaneous-entries"],
      async ({ pageParam = 1 }) => {
        const queryUrl = `/api/misc?page=${pageParam}`;

        const { data } = await axios(queryUrl);

        setNoNewData(false);

        return data as Miscellaneous[];
      },
      {
        getNextPageParam: (_, pages) => {
          return pages.length + 1;
        },
        initialData: { pages: [initialMiscEntries], pageParams: [1] },
      }
    );

  //infinite-scroll logic
  useEffect(() => {
    if (isFetching) return;

    if (data?.pages[data?.pages.length - 1].length === 0) {
      setNoNewData(true);
    }

    setMiscEntries(data?.pages.flatMap((page) => page) ?? initialMiscEntries);
  }, [data, initialMiscEntries, isFetching]);

  useEffect(() => {
    if (initialMiscEntries.length < INFINITE_SCROLLING_PAGINATION_RESULTS)
      return;

    if (entry?.isIntersecting && !noNewData) {
      fetchNextPage();
    }
  }, [entry, fetchNextPage, noNewData, initialMiscEntries]);

  if (miscEntries.length === 0) {
    return (
      <p className="mt-2 text-sm text-center tracking-tight text-muted-foreground">
        Your transactions will appear here.
      </p>
    );
  }

  console.log("isFetchingNextPage", isFetchingNextPage);
  console.log("isFetching", isFetching);
  console.log("---------");

  return (
    <div className="flex flex-col gap-y-2 text-sm">
      <div className="grid grid-cols-7 px-4 sm:px-6">
        <span className="hidden lg:block">Date & Time</span>
        <span className="col-span-5 lg:col-span-3">Details</span>
        <span className="text-center col-span-2">Amount</span>
      </div>
      {miscEntries.map((entry, index) => {
        if (index === miscEntries.length - 1) {
          return (
            <div key={entry.id} ref={ref}>
              <MiscEntryItem
                entry={entry}
                currency={currency}
                initialBalance={initialBalance}
              />
            </div>
          );
        } else {
          return (
            <div key={entry.id}>
              <MiscEntryItem
                entry={entry}
                currency={currency}
                initialBalance={initialBalance}
              />
            </div>
          );
        }
      })}
      {isFetchingNextPage &&
        Array.from({ length: 3 }).map((_, index) => (
          <MiscEntryItemSkeleton key={index} />
        ))}
    </div>
  );
};

export default MiscCard;

const MiscEntryItem = ({
  entry,
  initialBalance,
  currency,
}: {
  entry: Miscellaneous;
  initialBalance: number;
  currency: CurrencyType;
}) => {
  const transferEntry = entry.transferingFrom || entry.transferingTo;
  const transferText = entry.transferingFrom
    ? entry.transferingFrom
    : entry.transferingTo;

  const entryDetails = {
    entryId: entry.id,
    amount: entry.amount,
    description: entry.entryName,
    entryType: entry.entryType,
    initialBalance,
  };

  return (
    <Card>
      <CardContent className="grid grid-cols-7 px-4 sm:px-6 py-3">
        <div className="hidden lg:block items-center">
          <span className="text-xs tracking-tighter">
            {format(new Date(entry.createdAt), "dd MMM '·' h:mm a")}
          </span>
        </div>
        <span className="col-span-5 lg:col-span-3 break-words">
          {transferEntry ? (
            <>
              {`Transferred ${entry.transferingFrom ? "from" : "to"}
                      ${transferText} account`}
            </>
          ) : (
            entry.entryName
          )}
        </span>

        <span
          className={cn("text-center col-span-2", {
            "text-green-600": entry.entryType === "in",
            "text-red-500": entry.entryType === "out",
          })}
        >
          {entry.entryType === "in" ? "+" : "-"}
          {currency}
          {entry.amount.toLocaleString()}
        </span>
        {transferEntry ? (
          <Link
            href={`/${transferText}`}
            className="hidden lg:block text-primary text-center text-xs underline underline-offset-4"
          >
            {transferText &&
              transferText?.charAt(0).toUpperCase() + transferText?.slice(1)}
          </Link>
        ) : (
          <div className="hidden lg:flex justify-around items-center text-xs">
            <MiscEditEntry entryDetails={entryDetails} currency={currency} />
            <MiscDeleteEntry entryDetails={entryDetails} />
          </div>
        )}
      </CardContent>
      <CardFooter className="text-xs px-4 sm:px-6 pb-3 block lg:hidden">
        {transferEntry ? (
          <Link
            href={`/${transferText}`}
            className="text-primary text-center text-xs underline underline-offset-4"
          >
            {transferText &&
              transferText?.charAt(0).toUpperCase() + transferText?.slice(1)}
          </Link>
        ) : (
          <div className="flex gap-x-4 items-center text-xs">
            <MiscEditEntry entryDetails={entryDetails} currency={currency} />
            <MiscDeleteEntry entryDetails={entryDetails} />
          </div>
        )}
      </CardFooter>
    </Card>
  );
};
