import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { mockDb } from "@/lib/mock-backend-mobile";
import { useColors } from "@/hooks/useColors";

const AUDIENCE_COLORS: Record<string, string> = {
  All: "#2B6B3B",
  Students: "#1A5276",
  Parents: "#D4A040",
  Staff: "#C43427",
  Alumni: "#5B7060",
};

function AnnouncementCard({ item }: { item: ReturnType<typeof mockDb.getAnnouncements>[number] }) {
  const colors = useColors();
  const audienceColor = AUDIENCE_COLORS[item.audience] ?? colors.primary;

  return (
    <View style={[cardStyles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <View style={cardStyles.header}>
        <View style={[cardStyles.audienceBadge, { backgroundColor: audienceColor + "18" }]}>
          <Text style={[cardStyles.audienceText, { color: audienceColor }]}>{item.audience}</Text>
        </View>
        <Text style={[cardStyles.date, { color: colors.mutedForeground }]}>{item.date}</Text>
      </View>
      <Text style={[cardStyles.title, { color: colors.foreground }]}>{item.title}</Text>
      <Text style={[cardStyles.body, { color: colors.mutedForeground }]}>{item.body}</Text>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  audienceBadge: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  audienceText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  date: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  title: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    marginBottom: 6,
    lineHeight: 22,
  },
  body: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: "Inter_400Regular",
  },
});

export default function AnnouncementsScreen() {
  const { user, loading } = useAuth();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const announcements = mockDb.getAnnouncements();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading]);

  const webTopPad = Platform.OS === "web" ? 67 : 0;
  const webBotPad = Platform.OS === "web" ? 34 : 0;

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: insets.top + webTopPad + 16,
        paddingBottom: insets.bottom + webBotPad + 90,
        paddingHorizontal: 16,
      }}
      data={announcements}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <AnnouncementCard item={item} />}
      ListHeaderComponent={() => (
        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="notifications" size={22} color={colors.primary} />
            <Text style={{ fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground }}>
              Notices
            </Text>
          </View>
          <Text style={{ fontSize: 13, color: colors.mutedForeground, marginTop: 4 }}>
            School-wide announcements
          </Text>
        </View>
      )}
      scrollEnabled={!!(announcements.length > 0)}
      showsVerticalScrollIndicator={false}
    />
  );
}
