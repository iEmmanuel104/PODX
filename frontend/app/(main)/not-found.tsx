'use client';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import '../../app/globals.css';

export default function NotFound() {
    const router = useRouter();
    return (
        <div className="h-svh text-primary">
            <div className="m-auto flex h-screen w-full flex-col items-center justify-center gap-2">
                <h1 className="text-[7rem] font-bold leading-tight">404</h1>
                <span className="font-medium">Oops! Page Not Found!</span>
                <p className="text-center text-muted-foreground">
                    It seems like the page you&apos;re looking for <br />
                    does not exist or might have been removed.
                </p>
                <div className="mt-6 flex gap-4">
                    <Button variant="default" onClick={() => router.back()}>
                        Go Back
                    </Button>
                    <Link className={cn(buttonVariants({ variant: 'outline' }))} href={'/'}>
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
