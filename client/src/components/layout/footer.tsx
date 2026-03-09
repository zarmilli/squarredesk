import { Heart } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-4 mt-8 border-t border-stone-200">
      <div className="px-6">
        <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
          <div className="text-center lg:text-left">
            <div className="text-sm text-stone-600">
              © {currentYear}, made with{" "}
              <Heart className="w-3 h-3 inline-block text-red-500 fill-current" />{" "}
              by{" "}
              <a
                href="https://squarre.vercel.app"
                className="font-semibold text-stone-900 hover:text-stone-700 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                Squarre desk
              </a>{" "}• 
              Distributed by{" "}
              <a
                href="https://squarre.vercel.app"
                className="font-semibold text-stone-900 hover:text-stone-700 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                Squarre Pages
              </a>{" "}
              for a better web. 
            </div>
          </div>
          <div className="flex space-x-6">
            <a
              href="https://squarre.vercel.app/#team"
              className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
              rel="noopener noreferrer"
            >
              Team
            </a>
            <a
              href="https://squarre.vercel.app/#aboutus"
              className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
              rel="noopener noreferrer"
            >
              About Us
            </a>
            <a
              href="https://squarre.vercel.app/terms-and-conditions"
              className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
              rel="noopener noreferrer"
            >
              Terms of Service
            </a>
            <a
              href="https://squarre.vercel.app/privacy-policy"
              className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
              rel="noopener noreferrer"
            >
              privacy policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}