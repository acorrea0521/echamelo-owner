"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StreamThumbnailGrid } from "@/components/home/StreamThumbnailGrid";
import { mockStreams } from "@/lib/mock-data";

const TABS = ["En vivo", "Últimas", "Destacados", "Publicaciones"] as const;

export function ProfileTabs() {
  return (
    <Tabs defaultValue={TABS[0]} className="w-full px-4">
      <TabsList className="w-full justify-between bg-transparent p-0">
        {TABS.map((tab) => (
          <TabsTrigger
            key={tab}
            value={tab}
            className="flex-1 rounded-none border-b-2 border-transparent pb-2 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary"
          >
            {tab}
          </TabsTrigger>
        ))}
      </TabsList>
      {TABS.map((tab) => (
        <TabsContent key={tab} value={tab} className="mt-4 px-0">
          <StreamThumbnailGrid streams={mockStreams} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
