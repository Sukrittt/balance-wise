import { useCallback, useEffect, useState } from "react";
import { Input } from "@nextui-org/input";
import { useRouter } from "next/navigation";
import { Button } from "@nextui-org/button";
import { Spinner } from "@nextui-org/spinner";
import { RadioGroup, Radio } from "@nextui-org/radio";
import { useQueryClient } from "@tanstack/react-query";
import { ModalBody, ModalFooter } from "@nextui-org/modal";

import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import { toast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { EntryType, CurrencyType } from "@/types";
import { buttonVariants } from "@/components/ui/button";

export const MiscEditForm = ({
  onClose,
  currency,
  entryDetails,
  setDisabled,
}: {
  onClose: () => void;
  currency: CurrencyType;
  entryDetails: EntryType;
  setDisabled: (disabled: boolean) => void;
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState(entryDetails.amount.toLocaleString());
  const [description, setDescription] = useState(entryDetails.description);
  const [entryType, setEntryType] = useState(entryDetails.entryType);

  const [inputValidationState, setInputValidationState] = useState<
    "valid" | "invalid"
  >("valid");

  const updateMiscEntry = trpc.misc.editMiscEntry.useMutation({
    onSuccess: () => {
      router.refresh();
      queryClient.resetQueries(["miscellaneous-entries"]);

      toast({
        title: "Entry updated",
        description: "Your entry has been updated successfully.",
      });
      setDisabled(false);
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!amount) {
      return toast({
        title: "Amount is required",
        description: "Please enter a valid amount.",
        variant: "destructive",
      });
    }

    if (description.length === 0 || description.length > 100) {
      return toast({
        title: "Description is too long/short",
        description: "Please enter a valid description.",
        variant: "destructive",
      });
    }

    const parsedAmount = parseFloat(amount.replace(/,/g, ""));

    if (!parsedAmount) {
      return toast({
        title: "Amount is invalid",
        description: "Please enter a valid amount.",
        variant: "destructive",
      });
    }

    setDisabled(true);

    updateMiscEntry.mutate({
      amount: parsedAmount,
      description,
      entryType,
      initialBalance: entryDetails.initialBalance,
      miscId: entryDetails.entryId,
    });
  };

  const updateInputValidationState = useCallback(() => {
    if (!amount) return setInputValidationState("valid");

    if (parseFloat(amount) > 0) {
      setInputValidationState("valid");
    } else {
      setInputValidationState("invalid");
    }
  }, [amount]);

  useEffect(() => {
    updateInputValidationState();
  }, [amount, updateInputValidationState]);

  return (
    <>
      <ModalBody>
        <form className="grid w-full max-w-xl gap-5">
          <div className="flex flex-col gap-y-2">
            <Label>Amount</Label>
            <Input
              autoFocus
              placeholder="Eg: 500"
              value={amount ?? ""}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSubmit();
                }
              }}
              validationState={inputValidationState}
              errorMessage={
                inputValidationState === "invalid" &&
                "Please entery a valid amount."
              }
              startContent={
                <div className="pointer-events-none flex items-center">
                  <span className="text-default-400 text-small">
                    {currency}
                  </span>
                </div>
              }
            />
          </div>

          <div className="flex flex-col gap-y-2">
            <Label>Income Description</Label>
            <Input
              placeholder="Eg: Freelance"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSubmit();
                }
              }}
            />
          </div>
          <div>
            <RadioGroup
              orientation="horizontal"
              value={entryType}
              onValueChange={(value) => setEntryType(value as "in" | "out")}
            >
              <Radio value="in">Income</Radio>
              <Radio value="out">Expense</Radio>
            </RadioGroup>
          </div>
        </form>
      </ModalBody>
      <ModalFooter>
        <Button
          color="danger"
          className={cn(
            buttonVariants({ size: "sm", variant: "ghost" }),
            "rounded-lg"
          )}
          variant="light"
          onPress={onClose}
        >
          Close
        </Button>
        <Button
          color="primary"
          className={cn(buttonVariants({ size: "sm" }), "rounded-lg")}
          onClick={handleSubmit}
          disabled={updateMiscEntry.isLoading}
        >
          {updateMiscEntry.isLoading ? (
            <Spinner color="default" size="sm" />
          ) : (
            "Update"
          )}
        </Button>
      </ModalFooter>
    </>
  );
};
