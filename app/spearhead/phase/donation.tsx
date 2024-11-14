import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import Link from "next/link"

interface DonationsProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const Donations: React.FC<DonationsProps> = ({ isOpen, onOpenChange }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thank you for playing!</DialogTitle>
          <DialogDescription>
            You have completed all 4 rounds. Would you like to support our project?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button asChild>
            <Link href="https://agesofsigmar.com" rel="noopener noreferrer">
              Play Again
            </Link>
          </Button>
          <Button asChild>
            <Link href="https://account.venmo.com/u/Tim-Delesio" target="_blank" rel="noopener noreferrer">
              Donate Now
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Donations;