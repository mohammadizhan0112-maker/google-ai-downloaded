import React from 'react';
import { Twitter, Linkedin, Youtube, Send, MessageSquare, Share2, Shield, Hexagon } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-main border-t border-main pt-12 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Partners Section */}
        <div className="border-b border-main pb-8 mb-8">
          <div className="flex flex-wrap justify-center items-center gap-x-8 md:gap-x-16 gap-y-6">
            <div className="flex items-center gap-2 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500 cursor-pointer text-main">
              <span className="text-lg font-bold tracking-wider">BINANCE</span>
            </div>
            <div className="flex items-center gap-2 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500 cursor-pointer text-main">
              <Shield className="w-5 h-5 fill-current" />
              <span className="text-lg font-bold tracking-tight">Trust Wallet</span>
            </div>
            <div className="flex items-center gap-2 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500 cursor-pointer text-main">
              <Hexagon className="w-5 h-5 fill-current" />
              <span className="text-lg font-bold tracking-tighter">METAMASK</span>
            </div>
            <div className="flex items-center opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500 cursor-pointer text-main">
              <span className="text-xl font-serif font-bold tracking-tighter">Bloomberg</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
          <div>
            <h4 className="text-muted text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Institutional</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/dashboard" className="text-muted hover:text-main transition-colors">Staking</Link></li>
              <li><Link to="/strategies" className="text-muted hover:text-main transition-colors">Infrastructure</Link></li>
              <li><Link to="/dashboard" className="text-muted hover:text-main transition-colors">VaaS</Link></li>
              <li><Link to="/dashboard" className="text-muted hover:text-main transition-colors">SWQOS</Link></li>
              <li><Link to="/dashboard" className="text-muted hover:text-main transition-colors">ShredStream</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-muted text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Custodians</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/dashboard" className="text-muted hover:text-main transition-colors">Exchanges</Link></li>
              <li><Link to="/dashboard" className="text-muted hover:text-main transition-colors">Wallets</Link></li>
              <li><Link to="/dashboard" className="text-muted hover:text-main transition-colors">Asset Managers</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-muted text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Trust Center</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/support" className="text-muted hover:text-main transition-colors">Submit Vulnerability</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-muted text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Guides</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/blog" className="text-muted hover:text-main transition-colors">Yield SDK</Link></li>
              <li><Link to="/blog" className="text-muted hover:text-main transition-colors">Wallet SDK</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-muted text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Resources</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/blog" className="text-muted hover:text-main transition-colors">Blog</Link></li>
              <li><Link to="/markets" className="text-muted hover:text-main transition-colors">Reports</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-muted text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Company</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/blog" className="text-muted hover:text-main transition-colors">About</Link></li>
              <li><Link to="/blog" className="text-muted hover:text-main transition-colors">Careers</Link></li>
              <li><Link to="/blog" className="text-muted hover:text-main transition-colors">Events</Link></li>
              <li><Link to="/blog" className="text-muted hover:text-main transition-colors">Press</Link></li>
              <li><Link to="/support" className="text-muted hover:text-main transition-colors">Contact Us</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-main">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
            <div className="lg:col-span-4">
              <div className="space-y-2 text-[10px] text-muted leading-relaxed">
                <p className="font-bold text-muted uppercase tracking-wider">Eldetrades Validation Services LLC</p>
                <p>Hermes Corporate Services Ltd., Fifth Floor, Zephyr House</p>
                <p>122 Mary Street, George Town, P.O. Box 31493</p>
                <p>Grand Cayman KY1-1206, Cayman Islands</p>
              </div>
            </div>
            <div className="lg:col-span-8">
              <p className="text-[9px] text-muted/80 leading-relaxed text-justify">
                Eldetrades, Inc. or any of its affiliates is a software platform that provides infrastructure tools and resources for users, but does not offer investment advice or investment opportunities, manage funds, facilitate collective investment schemes, provide financial services, or take custody of, or otherwise hold or manage, customer assets. Eldetrades, Inc. or any of its affiliates does not conduct any independent diligence on or substantive review of any blockchain asset, digital currency, cryptocurrency, or associated funds. Eldetrades, Inc., or any of its affiliates, providing technology services that allow a user to stake digital assets, does not endorse or recommend any digital assets. Users are fully and solely responsible for evaluating whether to stake digital assets. All metrics displayed on the website, including without limitations value of staked assets, total number of active users, rewards rates, and networks supported, are historical figures and may not represent the actual real-time data.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between pt-6 border-t border-main gap-4">
            <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 text-[10px] font-medium text-muted">
              <Link to="/privacy" className="hover:text-main transition-colors">Privacy Notice</Link>
              <Link to="/terms" className="hover:text-main transition-colors">Terms of Use</Link>
              <Link to="/cookies" className="hover:text-main transition-colors">Cookie Policy</Link>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <a href="#" className="text-muted hover:text-main transition-colors"><Twitter className="w-3.5 h-3.5" /></a>
                <a href="#" className="text-muted hover:text-main transition-colors"><Linkedin className="w-3.5 h-3.5" /></a>
                <a href="#" className="text-muted hover:text-main transition-colors"><Youtube className="w-3.5 h-3.5" /></a>
                <a href="#" className="text-muted hover:text-main transition-colors"><Send className="w-3.5 h-3.5" /></a>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-muted text-[10px]">
                  © {new Date().getFullYear()} Eldetrades
                </p>
                <div className="w-6 h-6 rounded bg-emerald-500/5 flex items-center justify-center border border-emerald-500/10">
                  <Shield className="w-3 h-3 text-emerald-500/50" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
