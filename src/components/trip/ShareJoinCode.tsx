import { Copy, Share2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onClose: () => void;
  joinCode: string;
  tripName: string;
}

const ShareJoinCode = ({ open, onClose, joinCode, tripName }: Props) => {
  const shareText = `Join my trip "${tripName}" on Tripwise! 🌴\n\nJoin code: ${joinCode}\n\nOpen the app and enter this code to join.`;

  const copyCode = () => {
    navigator.clipboard.writeText(joinCode);
    toast({ title: 'Copied!', description: `Join code: ${joinCode}` });
  };

  const copyMessage = () => {
    navigator.clipboard.writeText(shareText);
    toast({ title: 'Message copied!', description: 'Share it with your friends.' });
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `Join ${tripName}`, text: shareText });
      } catch {
        // User cancelled
      }
    } else {
      copyMessage();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Share Trip Code</DialogTitle>
        </DialogHeader>

        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-3">Share this code with your friends</p>
          <div className="text-4xl font-mono font-bold tracking-[0.3em] bg-secondary py-4 rounded-xl mb-4">
            {joinCode}
          </div>
        </div>

        <div className="space-y-2">
          <Button onClick={copyCode} variant="secondary" className="w-full rounded-full gap-2">
            <Copy className="w-4 h-4" /> Copy Code
          </Button>
          <Button onClick={shareWhatsApp} className="w-full rounded-full gap-2 bg-[hsl(142,70%,40%)] hover:bg-[hsl(142,70%,35%)] text-white">
            <MessageCircle className="w-4 h-4" /> Share via WhatsApp
          </Button>
          <Button onClick={shareNative} variant="outline" className="w-full rounded-full gap-2">
            <Share2 className="w-4 h-4" /> More Options
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareJoinCode;
