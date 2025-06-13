import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ChatInputProps {
  gameId: number;
  currentUserId: number;
}

export function ChatInput({ gameId, currentUserId }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const queryClient = useQueryClient();

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest('POST', `/api/games/${gameId}/messages`, {
        content,
        type: 'chat'
      });
    },
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['/api/games', gameId.toString()] });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(message.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        disabled={sendMessageMutation.isPending}
        className="flex-grow"
      />
      <Button
        type="submit"
        size="sm"
        disabled={!message.trim() || sendMessageMutation.isPending}
        className="px-3"
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
}