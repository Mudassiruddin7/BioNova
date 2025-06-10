'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Github, Twitter, Linkedin, Mail, ArrowUpRight } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="relative bg-gray-900 text-gray-300 overflow-hidden">
      {/* DNA coil watermark */}
      <div className="absolute right-10 bottom-10 opacity-10">
        <motion.div
          animate={{ 
            rotateZ: 360,
            transition: { 
              duration: 20, 
              repeat: Infinity, 
              ease: "linear" 
            }
          }}
        >
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M40 0C17.9086 0 0 17.9086 0 40C0 62.0914 17.9086 80 40 80C62.0914 80 80 62.0914 80 40C80 17.9086 62.0914 0 40 0ZM40 12C40 12 40 12 40 12C40 12 40 12 40 12ZM12 40C12 24.536 24.536 12 40 12C55.464 12 68 24.536 68 40C68 55.464 55.464 68 40 68C24.536 68 12 55.464 12 40Z" fill="url(#paint0_linear)" />
            <path d="M40 32C35.5817 32 32 35.5817 32 40C32 44.4183 35.5817 48 40 48C44.4183 48 48 44.4183 48 40C48 35.5817 44.4183 32 40 32Z" fill="url(#paint1_linear)" />
            <defs>
              <linearGradient id="paint0_linear" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4361ee" />
                <stop offset="1" stopColor="#3a86ff" />
              </linearGradient>
              <linearGradient id="paint1_linear" x1="32" y1="32" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4361ee" />
                <stop offset="1" stopColor="#3a86ff" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
      </div>
      
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left section */}
          <div className="md:col-span-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400 mb-4">BioNova</h3>
              <p className="text-gray-400 mb-6">
                Built for the Future of Gene Editing
              </p>
              
              {/* Social links */}
              <div className="flex space-x-4">
                <Link href="https://github.com" target="_blank" className="text-gray-400 hover:text-white transition-colors">
                  <Github size={20} />
                </Link>
                <Link href="https://twitter.com" target="_blank" className="text-gray-400 hover:text-white transition-colors">
                  <Twitter size={20} />
                </Link>
                <Link href="https://linkedin.com" target="_blank" className="text-gray-400 hover:text-white transition-colors">
                  <Linkedin size={20} />
                </Link>
                <Link href="mailto:info@BioNova.ai" className="text-gray-400 hover:text-white transition-colors">
                  <Mail size={20} />
                </Link>
              </div>
            </motion.div>
          </div>
          
          {/* Center links */}
          <div className="md:col-span-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h4 className="text-white font-semibold mb-4">Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/crisprPredictor" className="text-gray-400 hover:text-white transition-colors flex items-center group">
                    <span>CRISPR Predictor</span>
                    <ArrowUpRight size={14} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
                <li>
                  <Link href="/lab-monitor" className="text-gray-400 hover:text-white transition-colors flex items-center group">
                    <span>Lab lab-monitor</span>
                    <ArrowUpRight size={14} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
                <li>
                  <Link href="/blockchain" className="text-gray-400 hover:text-white transition-colors flex items-center group">
                    <span>Blockchain Portal</span>
                    <ArrowUpRight size={14} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-gray-400 hover:text-white transition-colors flex items-center group">
                    <span>About</span>
                    <ArrowUpRight size={14} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              </ul>
            </motion.div>
          </div>
          
          {/* Right links */}
          <div className="md:col-span-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/docs" className="text-gray-400 hover:text-white transition-colors flex items-center group">
                    <span>Documentation</span>
                    <ArrowUpRight size={14} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors flex items-center group">
                    <span>Privacy Policy</span>
                    <ArrowUpRight size={14} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-gray-400 hover:text-white transition-colors flex items-center group">
                    <span>Terms of Service</span>
                    <ArrowUpRight size={14} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-gray-400 hover:text-white transition-colors flex items-center group">
                    <span>Contact</span>
                    <ArrowUpRight size={14} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
        
        {/* Divider */}
        <motion.div 
          className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent my-8"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        />
        
        {/* Copyright */}
        <motion.div
          className="text-center text-gray-500 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          © {currentYear} BioNova AI. All rights reserved.
        </motion.div>
      </div>
    </footer>
  )
} 