import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SaveAsTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeCount: number;
  onConfirm: (name: string) => void;
}

export function SaveAsTemplateDialog({ open, onOpenChange, nodeCount, onConfirm }: SaveAsTemplateDialogProps) {
  const [name, setName] = useState('');

  const handleConfirm = () => {
    if (!name.trim()) return;
    onConfirm(name.trim());
    setName('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save as Template</DialogTitle>
          <DialogDescription>
            Save this {nodeCount}-node map as a reusable template. It'll appear under "My Templates" next time you start a new map.
          </DialogDescription>
        </DialogHeader>
        <Input
          autoFocus
          placeholder="Template name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleConfirm();
          }}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={!name.trim()}>Save Template</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
 