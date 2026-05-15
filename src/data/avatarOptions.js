import manAvatar from '../assets/man.webp'
import man2Avatar from '../assets/man2.webp'
import womenAvatar from '../assets/women.webp'
import women2Avatar from '../assets/women2.webp'
import women3Avatar from '../assets/women3.webp'

export const avatarOptions = [
  { id: 'women', label: 'Kadın', src: womenAvatar },
  { id: 'women2', label: 'Kadın 2', src: women2Avatar },
  { id: 'women3', label: 'Kadın 3', src: women3Avatar },
  { id: 'man', label: 'Erkek', src: manAvatar },
  { id: 'man2', label: 'Erkek 2', src: man2Avatar },
]

export function getAvatarById(avatarId) {
  return avatarOptions.find((avatar) => avatar.id === avatarId) || avatarOptions[0]
}
