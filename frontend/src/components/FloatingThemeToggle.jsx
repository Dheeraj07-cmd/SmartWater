import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function FloatingThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className="fixed bottom-6 right-6 p-4 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xl border border-gray-200 dark:border-gray-700 z-50 transition-colors"
        >
            {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
        </motion.button>
    );
}