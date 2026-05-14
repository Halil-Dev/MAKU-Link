import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import makulinkLogo from '../../assets/ChatGPT Image 7 May 2026 22_31_53.png'

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
              <button onClick={() => navigate('/games')} className="theme-title w-fit text-left text-sm font-semibold text-[#092F64] transition hover:text-[#468BE6]">Oyunlar & Quiz</button>
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#092F64]/50">İletişim</span>
              <a href="#" className="theme-title text-sm font-semibold text-[#092F64] transition hover:text-[#468BE6]">Hakkımızda</a>
              <a href="#" className="theme-title text-sm font-semibold text-[#092F64] transition hover:text-[#468BE6]">Gizlilik Sözleşmesi</a>
              <a href="#" className="theme-title text-sm font-semibold text-[#092F64] transition hover:text-[#468BE6]">Kurallar</a>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/55 pt-6 sm:flex-row">
          <p className="theme-muted text-xs font-semibold text-[#1F1F1F]/50">
            © {currentYear} MAKÜLink. Tüm hakları saklıdır.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/60 text-[#092F64] shadow-sm transition hover:-translate-y-0.5 hover:bg-white">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
              </svg>
            </a>
            <a href="#" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/60 text-[#092F64] shadow-sm transition hover:-translate-y-0.5 hover:bg-white">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </motion.footer>
  )
}
