import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import makulinkLogo from '../../assets/logo-main.webp'

export default function Footer() {
  const navigate = useNavigate()
  const currentYear = new Date().getFullYear()

  return (
    <motion.footer 
      className="mt-12 w-full border-t border-white/45 bg-[#E9F5FF]/40 px-5 py-8 pb-32 lg:pb-12 shadow-[0_-10px_40px_rgba(9,47,100,0.03)] backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.6 }}
    >
      <div className="mx-auto max-w-[1560px]">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          
          <div className="flex flex-col gap-3">
            <button type="button" onClick={() => window.scrollTo(0, 0)} className="flex w-fit items-center gap-3 text-left">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-[14px] border border-white/60 bg-[#E9F5FF] shadow-[0_8px_20px_rgba(9,47,100,0.15)]">
                <img
                  src={makulinkLogo}
                  alt="MAKÜLink logo"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="leading-tight">
                <p className="theme-title text-base font-bold text-[#092F64]">
                  MAKÜ<span className="text-[#468BE6]">Link</span>
                </p>
                <p className="theme-muted text-[11px] font-semibold text-[#1F1F1F]/60">Kampüsün nabzı</p>
              </div>
            </button>
            <p className="theme-muted max-w-sm text-xs font-medium leading-relaxed text-[#1F1F1F]/70">
              Mehmet Akif Ersoy Üniversitesi öğrencileri için geliştirilmiş, kampüste sosyalleşmeyi ve haberdar kalmayı sağlayan öğrenci platformu.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-12 gap-y-6">
            <div className="flex flex-col gap-2.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#092F64]/50">Platform</span>
              <button onClick={() => navigate('/')} className="theme-title w-fit text-left text-sm font-semibold text-[#092F64] transition hover:text-[#468BE6]">Ana Sayfa</button>
              <button onClick={() => navigate('/communities')} className="theme-title w-fit text-left text-sm font-semibold text-[#092F64] transition hover:text-[#468BE6]">Topluluklar</button>
              <button onClick={() => navigate('/games')} className="theme-title w-fit text-left text-sm font-semibold text-[#092F64] transition hover:text-[#468BE6]">Oyunlar</button>
              <button onClick={() => navigate('/quiz')} className="theme-title w-fit text-left text-sm font-semibold text-[#092F64] transition hover:text-[#468BE6]">Quizler</button>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/55 pt-6 sm:flex-row">
          <p className="theme-muted text-xs font-semibold text-[#1F1F1F]/50">
            © {currentYear} MAKÜLink. Tüm hakları saklıdır.
          </p>

        </div>
      </div>
    </motion.footer>
  )
}
