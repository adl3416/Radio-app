import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../contexts/AppContext';

const { width, height } = Dimensions.get('window');

interface ModernDrawerMenuProps {
  isVisible: boolean;
  onClose: () => void;
  onNavigate: (screen: string) => void;
}

export const ModernDrawerMenu: React.FC<ModernDrawerMenuProps> = ({
  isVisible,
  onClose,
  onNavigate,
}) => {
  const { isDark, toggleTheme } = useAppContext();

  const menuItems = [
    { id: 'home', title: 'Tüm Radyolar', icon: 'radio', color: '#3B82F6' },
    { id: 'categories', title: 'Kategoriler', icon: 'grid', color: '#8B5CF6' },
    { id: 'favorites', title: 'Favorilerim', icon: 'heart', color: '#EF4444' },
    { id: 'recent', title: 'Bölgeler', icon: 'map', color: '#10B981' },
    { id: 'sleep', title: 'Uyku Modu Kapalı', icon: 'moon', color: '#F59E0B' },
    { id: 'alarm', title: 'Alarm Kapalı', icon: 'alarm', color: '#6366F1' },
    { id: 'settings', title: 'Seçenekler', icon: 'settings', color: '#64748B' },
    { id: 'review', title: 'Yorum Yaz', icon: 'star', color: '#F97316' },
  ];

  const handleItemPress = (item: any) => {
    if (item.id === 'sleep') {
      // Toggle sleep mode
    } else if (item.id === 'alarm') {
      // Toggle alarm
    } else {
      onNavigate(item.id);
    }
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={onClose}
        />
        
        <View style={[styles.menuContainer, isDark && styles.menuContainerDark]}>
          <LinearGradient
            colors={isDark ? ['#1F2937', '#111827'] : ['#4F46E5', '#7C3AED']}
            style={styles.menuHeader}
          >
            <SafeAreaView>
              <View style={styles.headerContent}>
                <View style={styles.headerInfo}>
                  <Text style={styles.headerTitle}>📻 Radyo Menü</Text>
                  <Text style={styles.headerSubtitle}>Seçeneklerinizi keşfedin</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </LinearGradient>

          <View style={styles.menuContent}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.menuItem,
                  isDark && styles.menuItemDark,
                  index === menuItems.length - 1 && styles.lastMenuItem
                ]}
                onPress={() => handleItemPress(item)}
              >
                <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                  <Ionicons name={item.icon as any} size={20} color="white" />
                </View>
                <Text style={[styles.menuItemText, isDark && styles.menuItemTextDark]}>
                  {item.title}
                </Text>
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color={isDark ? '#9CA3AF' : '#6B7280'} 
                />
              </TouchableOpacity>
            ))}

            {/* Theme Toggle */}
            <TouchableOpacity
              style={[styles.menuItem, isDark && styles.menuItemDark, styles.themeToggle]}
              onPress={toggleTheme}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#F59E0B' }]}>
                <Ionicons name={isDark ? 'sunny' : 'moon'} size={20} color="white" />
              </View>
              <Text style={[styles.menuItemText, isDark && styles.menuItemTextDark]}>
                {isDark ? 'Açık Tema' : 'Koyu Tema'}
              </Text>
              <View style={[styles.switch, isDark && styles.switchActive]}>
                <View style={[styles.switchThumb, isDark && styles.switchThumbActive]} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flexDirection: 'row',
  },
  overlayTouchable: {
    flex: 0.3,
  },
  menuContainer: {
    flex: 0.7,
    backgroundColor: '#FFFFFF',
    marginLeft: 'auto',
  },
  menuContainerDark: {
    backgroundColor: '#1F2937',
  },
  menuHeader: {
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  closeButton: {
    padding: 8,
  },
  menuContent: {
    flex: 1,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemDark: {
    borderBottomColor: '#374151',
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  menuItemTextDark: {
    color: '#F9FAFB',
  },
  themeToggle: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  switch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  switchActive: {
    backgroundColor: '#3B82F6',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  switchThumbActive: {
    transform: [{ translateX: 22 }],
  },
});
