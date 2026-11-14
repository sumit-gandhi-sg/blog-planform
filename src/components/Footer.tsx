import Link from "next/link";
import { Feather } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-gray-200/80 dark:border-white/[0.07] py-8 text-xs text-gray-400">
      <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-[6px] bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center">
            <Feather className="w-2.5 h-2.5 text-white stroke-[2.2px]" />
          </div>
          <span className="font-semibold text-gray-700 dark:text-gray-300">Inkwell</span>
          <span>— A modern publishing platform</span>
        </div>

        <div className="flex items-center gap-5">
          <Link href="/blogs" className="hover:text-accent transition-colors no-underline text-inherit">
            Feed
          </Link>
          <Link href="/write" className="hover:text-accent transition-colors no-underline text-inherit">
            Write
          </Link>
          <a
            href="/sitemap.xml"
            target="_blank"
            className="hover:text-accent transition-colors no-underline text-inherit"
          >
            Sitemap
          </a>
        </div>

        <p className="m-0">© {new Date().getFullYear()} Inkwell · Built with Next.js & Tailwind</p>
      </div>
    </footer>
  );
}

export default Footer;
