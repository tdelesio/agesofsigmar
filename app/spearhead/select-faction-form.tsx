"use client"

import { useRouter } from 'next/navigation'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Alliances, NVP } from "./alliances"
import { navigateToTactics } from "./redirect"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from 'react'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from '@radix-ui/react-select'

const profileFormSchema = z.object({
  faction: z.number({
    required_error: "Please select a faction.",
  }),
  alliance: z.string({
    required_error: "Please select an alliance.",
  }),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export default function SelectFactionForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableFactions, setAvailableFactions] = useState<NVP[]>([])
  const router = useRouter()

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    mode: "onChange",
  })

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true)
    try {
      await navigateToTactics(data.faction)
    } catch (error) {
      console.error("Navigation error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    const alliance = form.watch("alliance")
    if (alliance) {
      const selectedAlliance = Alliances.alliances.find(a => a.id === alliance)
      setAvailableFactions(selectedAlliance ? selectedAlliance.factions.map(f => typeof f === 'number' ? { id: f, name: f } : f) : [])
      form.setValue("faction", 0) // Reset faction when alliance changes
    }
  }, [form.watch("alliance")])

  return (
    <div className="w-full max-w-md mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold text-center mb-6">Select Your Faction</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="alliance"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg">Alliance</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select an alliance" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Alliances.alliances.map((alliance) => (
                      <SelectItem key={alliance.id} value={alliance.id}>
                        {alliance.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose your alliance to view available factions.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="faction"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg">Faction</FormLabel>
                <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a faction" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableFactions.map((faction) => (
                      <SelectItem key={faction.id} value={faction.id.toString()}>
                        {faction.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose your faction to view its specific tactics and abilities.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Selecting..." : "Select Faction"}
          </Button>
        </form>
      </Form>
<Separator className='pt-5'/>
      <div className="app-description">
  <section className="mb-6">
    <h2 className="text-2xl font-bold mb-3">Overview</h2>
    <p className="text-gray-700 leading-relaxed">
      I built this app to help with running Warhammer AoS Spearhead games. I found it difficult to manage abilities. Some of them are one-time use, others can be applied only during specific rounds, and they are located on the Battle Traits, Regiment Abilities, and Enhancements as well as on Battle Tome cards. All of this is hard to keep track of, and most of the time I miss abilities that I could have used. The idea of this app is to manage yourself and the faction you are playing with (not the game itself). The phases are broken down just like the game expects. You can either swipe to the next phase or click the arrow button on the navigation at the top. If you click home, it resets all your choices and lets you start over. I added a Victory Point track that appears on the End stage to help you keep track of that. The Next Round button will go back to start and advance the next round. Eventually, I will be adding logic to help with some abilities.
    </p>
  </section>

  <section className="mb-6">
    <h2 className="text-2xl font-bold mb-3">Getting Started and Cards</h2>
    <p className="text-gray-700 leading-relaxed">
      Start by selecting your Alliance and Faction. There is also an option to deal (virtually) the Battle Tactic cards from Spearhead. It functions as the actual deck and will provide you with 3 cards. If you use them (either the command or the scoring), just click on them and they will be removed from your hand. At the end of the round, your hand will be refilled back up to 3 cards.
    </p>
  </section>

  <section className="mb-6">
    <h2 className="text-2xl font-bold mb-3">Abilities</h2>
    <p className="text-gray-700 leading-relaxed">
      Abilities have been filtered to only show up during the phase that you can use them. For instance, if a Regiment Ability can only be used during the HERO phase, it will not show up until that phase. Passive abilities are always there. The one-time use cards are marked as such. You can click on them if you would like the app to remember they were used. The ability will be greyed out and marked as used. I manually transcribed all the abilities, and I probably made mistakes everywhere from spelling errors to marking things incorrectly. If you find something, let me know and I will fix it.
    </p>
  </section>
</div>
     
    </div>
  )
}