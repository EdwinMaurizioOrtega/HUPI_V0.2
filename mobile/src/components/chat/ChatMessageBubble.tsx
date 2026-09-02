import { ThemedView as View } from '@/theme/ThemedView';
import {
  StyleSheet,
} from 'react-native';

import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { Text } from '@/i18n/components';

type ChatMessageBubbleProps = {
  attachmentType?: 'image' | 'document' | 'receipt' | null;
  isOwn: boolean;
  senderLabel?: string;
  status?: 'Enviado' | 'Leído';
  text: string;
  time: string;
};

const attachmentCopy = {
  image: 'Imagen adjunta',
  document: 'Documento adjunto',
  receipt: 'Comprobante adjunto',
} as const;

export function ChatMessageBubble({
  attachmentType = null,
  isOwn,
  senderLabel,
  status,
  text,
  time,
}: ChatMessageBubbleProps) {
  const isSystem = senderLabel === 'Hupi';

  return (
    <View style={[styles.row, isOwn && styles.clientRow, isSystem && styles.systemRow]}>
      <View style={[styles.bubble, isOwn && styles.clientBubble, isSystem && styles.systemBubble]}>
        {senderLabel ? <Text style={[styles.senderLabel, isOwn && styles.clientTime]}>{senderLabel}</Text> : null}
        {attachmentType ? (
          <View style={[styles.attachment, isOwn && styles.clientAttachment]}>
            <Text style={[styles.attachmentText, isOwn && styles.clientText]}>{attachmentCopy[attachmentType]}</Text>
          </View>
        ) : null}
        <Text style={[styles.text, isOwn && styles.clientText, isSystem && styles.systemText]}>
          {text}
        </Text>
        <Text style={[styles.time, isOwn && styles.clientTime]}>
          {time}{status ? ` · ${status}` : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'flex-start' },
  clientRow: { justifyContent: 'flex-end' },
  systemRow: { justifyContent: 'center' },
  bubble: {
    maxWidth: '82%',
    borderRadius: 18,
    borderTopLeftRadius: 6,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  clientBubble: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 6,
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  systemBubble: {
    maxWidth: '92%',
    borderRadius: 15,
    backgroundColor: colors.soft,
    borderColor: '#e6ddc7',
  },
  senderLabel: { color: colors.secondary, fontFamily: fonts.bold, fontSize: 13, fontWeight: '900', marginBottom: 3 },
  attachment: {
    borderRadius: 12,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 7,
  },
  clientAttachment: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderColor: 'rgba(255, 255, 255, 0.24)',
  },
  attachmentText: { color: colors.secondary, fontFamily: fonts.bold, fontSize: 15, fontWeight: '900' },
  text: { color: colors.text, fontFamily: fonts.semiBold, fontSize: 15, lineHeight: 21, fontWeight: '600' },
  clientText: { color: colors.white },
  systemText: { color: colors.text, fontSize: 15, lineHeight: 22 },
  time: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, marginTop: 5, alignSelf: 'flex-end' },
  clientTime: { color: '#ffe8e1' },
});
