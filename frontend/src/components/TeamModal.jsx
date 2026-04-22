import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Cylinders = () => (
  <div className="flex gap-1 items-end h-full w-full justify-center p-1">
    <motion.div 
      animate={{ height: ["60%", "90%", "60%"] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      className="w-4 bg-primary-500 rounded-sm relative"
    >
      <div className="absolute -top-1 left-0 w-full h-2 bg-primary-400 rounded-[100%] border border-primary-600" />
      <div className="absolute bottom-0 left-0 w-full h-2 bg-primary-600 rounded-[100%] mb-[-4px]" />
    </motion.div>
    <motion.div 
      animate={{ height: ["80%", "50%", "80%"] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      className="w-4 bg-accent-500 rounded-sm relative"
    >
      <div className="absolute -top-1 left-0 w-full h-2 bg-accent-400 rounded-[100%] border border-accent-600" />
      <div className="absolute bottom-0 left-0 w-full h-2 bg-accent-600 rounded-[100%] mb-[-4px]" />
    </motion.div>
  </div>
);

const TEAM_MEMBERS = [
  {
    name: 'MOHANTARAK ARIPILLI',
    linkedin: 'https://www.linkedin.com/in/mohantarak-aripilli-8b8336348',
    image: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg'
  },
  {
    name: 'BASA DIVAKAR REDDY',
    linkedin: 'https://linkedin.com/in/basa-divakar-reddy-765321325',
    image: <Cylinders />
  },
  {
    name: 'DHEERAJ KANTUMUTCHU',
    linkedin: 'https://linkedin.com/in/dheeraj-kantumutchu-a86455330',
    image: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg'
  },
  {
    name: 'KISHORE CHOWDARY MUPPANA',
    linkedin: 'https://linkedin.com/in/kishore-chowdary-muppana-6a3abb348',
    image: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg'
  }
];

const TeamRow = ({ member, index }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.1, duration: 0.5 }}
    onClick={() => window.open(member.linkedin, '_blank')}
    className="group cursor-pointer"
  >
    <div className="flex items-center gap-4 rounded-xl border border-surface-700/40 bg-gradient-to-r from-surface-800/40 to-surface-900/40 px-5 py-4 transition-all duration-300 hover:border-primary-500/40 hover:shadow-lg hover:shadow-primary-500/10 hover:bg-gradient-to-r hover:from-surface-800/60 hover:to-surface-900/60">
      {/* Icon/Image */}
      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-surface-700/40 group-hover:bg-primary-500/15 transition-colors duration-300 border border-surface-600/40 group-hover:border-primary-500/30">
        {typeof member.image === 'string' ? (
          <img src={member.image} alt={member.name} className="h-10 w-10 object-contain" />
        ) : (
          <div className="h-10 w-10">
            {member.image}
          </div>
        )}
      </div>

      {/* Name - Clickable */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-white group-hover:text-primary-300 transition-colors duration-300 truncate">
          {member.name}
        </h3>
      </div>

      {/* LinkedIn Icon */}
      <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded bg-blue-600/20 border border-blue-500/40 group-hover:bg-blue-600/40 group-hover:border-blue-500/60 transition-all duration-300 group-hover:scale-110">
        <svg className="h-4 w-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z" />
        </svg>
      </div>
    </div>
  </motion.div>
);

export default function TeamModal({ isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-surface-700/40 bg-gradient-to-br from-surface-900 to-surface-950 shadow-2xl shadow-black/50">
              {/* Header */}
              <div className="sticky top-0 z-10 border-b border-surface-700/40 bg-surface-900/95 backdrop-blur-sm px-6 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <span>👥</span> Our Team
                    </h2>
                    <p className="text-sm text-surface-400 mt-1">The minds behind SmartCart</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="rounded-lg p-2 text-surface-400 hover:bg-surface-800 hover:text-white transition-all"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  {TEAM_MEMBERS.map((member, index) => (
                    <TeamRow key={member.name} member={member} index={index} />
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-surface-700/40 bg-surface-950 px-6 py-4 text-center">
                <p className="text-xs text-surface-500 italic">
                  "SmartCart was built with the vision of making everyday shopping more efficient through technology."
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
