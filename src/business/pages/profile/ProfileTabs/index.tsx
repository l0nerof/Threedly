import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/Tabs";
import { Bot, Home, Settings, User } from "lucide-react";

const tabs = [
  {
    name: "Home",
    value: "home",
    icon: Home,
  },
  {
    name: "Profile",
    value: "profile",
    icon: User,
  },
  {
    name: "Messages",
    value: "messages",
    icon: Bot,
  },
  {
    name: "Settings",
    value: "settings",
    icon: Settings,
  },
];

export default function ProfileTabs() {
  return (
    <div className="w-full">
      <div className="block md:hidden">
        <Tabs
          orientation="horizontal"
          defaultValue={tabs[0].value}
          className="flex w-full flex-col gap-4"
        >
          <TabsList className="w-full bg-background">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex-1 justify-center py-1.5"
              >
                <div className="flex items-center gap-2">
                  <tab.icon className="h-5 w-5" />
                  <span className="hidden sm:inline">{tab.name}</span>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex h-full w-full items-center justify-center font-medium text-muted-foreground">
            {tabs.map((tab) => (
              <TabsContent
                key={tab.value}
                value={tab.value}
                className="flex h-full items-center justify-center"
              >
                {tab.name} Content
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>

      {/* Desktop layout - vertical tabs */}
      <div className="hidden md:block">
        <Tabs
          orientation="vertical"
          defaultValue={tabs[0].value}
          className="flex w-full flex-row items-start justify-center gap-10"
        >
          <TabsList className="basis-1/4 flex-col bg-background">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="w-full justify-start py-1.5"
              >
                <div className="flex items-center gap-2">
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex h-full w-full items-center justify-center font-medium text-muted-foreground">
            {tabs.map((tab) => (
              <TabsContent
                key={tab.value}
                value={tab.value}
                className="h-full w-full"
              >
                {tab.name} Content
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>
    </div>
  );
}
