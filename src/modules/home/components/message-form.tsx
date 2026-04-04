"use client";
import { toast } from "sonner";
import { useCreateMessages } from "@/modules/messages/hooks/message";
import { useStatus } from "@/modules/usage/hooks/usage";
import { Usage } from "@/modules/usage/components/usage";
import { getActionErrorMessage } from "@/lib/action-error";
import { AiInput002 } from "@/components/watermelon/ai-input-002";

interface Props {
  projectId: string;
}

const MessageForm = ({ projectId }: Props) => {
  const { mutateAsync, isPending } = useCreateMessages(projectId);
  const { data: usage } = useStatus();

  const handleSend = async (content: string) => {
    try {
      await mutateAsync(content);
    } catch (error) {
      toast.error(getActionErrorMessage(error));
    }
  };

  return (
    <div className="flex flex-col gap-1">
      {!!usage && <Usage />}
      <AiInput002
        placeholderText="Describe what you want to create..."
        onSend={handleSend}
      />
    </div>
  );
};

export default MessageForm;
