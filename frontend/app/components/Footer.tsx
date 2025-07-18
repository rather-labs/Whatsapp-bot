export default function Footer() {
  const socialLinks = [
    {
      name: 'LinkedIn',
      url: 'https://www.linkedin.com/company/ratherlabs/',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
    },
    {
      name: 'Instagram',
      url: 'https://www.instagram.com/rather_labs/',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path fillRule="evenodd" d="M12.017 0C8.396 0 7.999.01 6.756.048 5.517.086 4.668.22 3.933.42c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.43 4.875.296 5.724.258 6.963.01 8.206 0 8.603 0 12.017s.01 3.81.048 5.052c.038 1.24.172 2.089.372 2.824.306.789.717 1.459 1.384 2.126s1.337 1.078 2.126 1.384c.735.2 1.584.334 2.823.372C7.999 23.99 8.396 24 12.017 24s4.017-.01 5.052-.048c1.24-.038 2.089-.172 2.824-.372.789-.306 1.459-.717 2.126-1.384s1.078-1.337 1.384-2.126c.2-.735.334-1.584.372-2.823.048-1.242.048-1.64.048-5.052s-.01-4.017-.048-5.052c-.038-1.24-.172-2.089-.372-2.824-.306-.789-.717-1.459-1.384-2.126S19.063.935 18.274.63C17.539.43 16.69.296 15.451.258 14.208.01 13.811 0 12.017 0zm0 2.16c3.29 0 3.67.013 4.947.048 1.194.055 1.843.255 2.273.42.572.222.98.487 1.409.916.43.43.694.837.837 1.409.165.43.365 1.079.42 2.273.035 1.277.048 1.657.048 4.947s-.013 3.67-.048 4.947c-.055 1.194-.255 1.843-.42 2.273-.222.572-.487.98-.916 1.409-.43.43-.837.694-1.409.916-.43.165-1.079.365-2.273.42-1.277.035-1.657.048-4.947.048s-3.67-.013-4.947-.048c-1.194-.055-1.843-.255-2.273-.42-.572-.222-.98-.487-1.409-.916-.43-.43-.694-.837-.916-1.409-.165-.43-.365-1.079-.42-2.273C2.173 15.687 2.16 15.307 2.16 12.017s.013-3.67.048-4.947c.055-1.194.255-1.843.42-2.273.222-.572.487-.98.916-1.409.43-.43.837-.694 1.409-.916.43-.165 1.079-.365 2.273-.42 1.277-.035 1.657-.048 4.947-.048z"/>
          <path d="M12.017 5.838a6.179 6.179 0 1 0 0 12.358 6.179 6.179 0 0 0 0-12.358zM12.017 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
        </svg>
      ),
    },
    {
      name: 'X',
      url: 'https://x.com/rather_labs',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
    },
    {
      name: 'YouTube',
      url: 'https://www.youtube.com/@ratherlabs',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z"/>
        </svg>
      ),
    },
  ];

  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <div className="text-sm text-gray-600 dark:text-gray-400 pb-4">
            &copy; {new Date().getFullYear()} Rather Lab's Chat-ching Bot. All rights reserved.
          </div>
          
          <div className="flex space-x-4">
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center justify-center w-10 h-10 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:shadow-md transition-all duration-300 hover:scale-110 cursor-default"
                aria-label={`Visit our ${link.name} page`}
              >
                <div className="text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                  {link.icon}
                </div>
                
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                  {link.name}
                  <div className="absolute top-full left-1/2 w-0 h-0 border-t-4 border-t-gray-900 dark:border-t-gray-100 border-x-4 border-x-transparent transform -translate-x-1/2" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
} 