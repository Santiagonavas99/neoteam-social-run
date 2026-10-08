import { MessageCircle } from 'lucide-react'
import { InstagramIcon } from '@/components/instagram-icon'
import { communityLinks } from '@/features/event/community-links'

// One shared rail for all public routes; admin pages never mount this component.
export function SocialRail() {
  return (
    <nav className="site-social-rail" aria-label="Redes y comunidad NeoTeam">
      <span className="site-social-rail-title" aria-hidden="true">
        CONECTA
      </span>
      <a
        href={communityLinks.instagram}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Seguir a NeoTeam en Instagram"
        title="Instagram · @neoteam_cali"
      >
        <InstagramIcon aria-hidden className="size-5" />
      </a>
      <a
        href={communityLinks.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Unirme a la comunidad de WhatsApp de NeoTeam"
        title="Comunidad de WhatsApp"
      >
        <MessageCircle aria-hidden className="size-5" />
      </a>
    </nav>
  )
}
