import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { PenLine, Home, ArrowLeft } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  showBack?: boolean;
  title?: string;
}

export function Header({ showBack = false, title }: HeaderProps) {
  const [location] = useLocation();

  return (
    <header 
      className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      data-testid="header"
    >
      <div className="max-w-6xl mx-auto flex h-16 items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-4">
          {showBack ? (
            <Link href="/">
              <Button variant="ghost" size="sm" data-testid="button-back">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Back
              </Button>
            </Link>
          ) : (
            <Link href="/">
              <div className="flex items-center gap-2 hover-elevate rounded-md px-2 py-1.5 cursor-pointer" data-testid="link-home">
                <Home className="w-5 h-5 text-foreground" />
                <span className="text-xl font-semibold text-foreground">
                  My Blog
                </span>
              </div>
            </Link>
          )}
          {title && (
            <span className="text-lg font-medium text-foreground truncate max-w-xs">
              {title}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {location !== '/new' && !location.startsWith('/edit/') && (
            <Link href="/new">
              <Button data-testid="button-new-post">
                <PenLine className="w-4 h-4 mr-1.5" />
                New Post
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
