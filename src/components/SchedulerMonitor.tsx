
"use client"

import { useEffect } from "react"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where, doc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore"

/**
 * SchedulerMonitor (Production Grade)
 * 
 * This component runs in the background of the app. It identifies campaigns 
 * marked as 'Scheduled' that have reached their execution point. 
 * On a VPS, this would be a Cron job, but for the React client, we 
 * use an active monitoring pattern to trigger the engine.
 */
export function SchedulerMonitor() {
  const { user } = useUser()
  const db = useFirestore()

  // Track scheduled campaigns
  const scheduledQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "admins", user.uid, "campaigns"),
      where("status", "==", "Scheduled")
    )
  }, [db, user])

  const { data: scheduledCampaigns } = useCollection(scheduledQuery)

  useEffect(() => {
    if (!scheduledCampaigns || !db || !user) return

    const checkInterval = setInterval(async () => {
      const now = new Date()
      
      for (const campaign of scheduledCampaigns) {
        if (!campaign.scheduledDateTime) continue
        
        const scheduledTime = new Date(campaign.scheduledDateTime)
        
        if (scheduledTime <= now) {
          console.log(`[ENGINE] Triggering scheduled campaign: ${campaign.name}`)
          
          const runId = `run-${Date.now()}`
          const campaignRef = doc(db, "admins", user.uid, "campaigns", campaign.id)
          const runRef = doc(db, "admins", user.uid, "campaigns", campaign.id, "runs", runId)
          const notifyRef = doc(collection(db, "admins", user.uid, "notifications"))

          // 1. Activate Campaign
          await updateDoc(campaignRef, {
            status: "Running",
            lastRunId: runId,
            updatedAt: serverTimestamp()
          })

          // 2. Initialize Run
          await setDoc(runRef, {
            id: runId,
            campaignId: campaign.id,
            adminUserId: user.uid,
            status: "Running",
            startTime: serverTimestamp(),
            progressTotalUrlsToProcess: campaign.targetEmailCount * 5,
            progressUrlsProcessed: 0,
            progressUrlsRemaining: campaign.targetEmailCount * 5,
            progressDomainsWithEmails: 0,
            totalEmailsExtracted: 0,
            validEmailsExtracted: 0,
            flaggedEmailsExtracted: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          })

          // 3. Log Event
          await setDoc(notifyRef, {
            adminUserId: user.uid,
            title: "Scheduled Campaign Started",
            description: `Auto-activation of ${campaign.name} successful. Nodes are online.`,
            timestamp: serverTimestamp(),
            isRead: false,
            eventType: "campaignStarted",
            relatedCampaignId: campaign.id,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          })
        }
      }
    }, 10000) // Check every 10 seconds

    return () => clearInterval(checkInterval)
  }, [scheduledCampaigns, db, user])

  return null // Invisible logic component
}
