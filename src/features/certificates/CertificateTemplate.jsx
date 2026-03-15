import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { formatDate } from '@/lib/utils';

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FFFFFF',
    padding: 60,
    fontFamily: 'Helvetica',
  },
  border: {
    border: '8px solid #0A2463',
    padding: 40,
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    backgroundColor: '#0A2463',
    padding: '20 40',
    marginBottom: 30,
    alignItems: 'center',
  },
  headerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 3,
  },
  title: {
    fontSize: 36,
    fontFamily: 'Helvetica-Bold',
    color: '#0A2463',
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 30,
  },
  name: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: '#FF6D00',
    textAlign: 'center',
    marginBottom: 20,
    borderBottom: '2px solid #0F9B8E',
    paddingBottom: 10,
  },
  courseTitle: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#0A2463',
    textAlign: 'center',
    marginBottom: 30,
  },
  date: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 10,
  },
  certNumber: {
    fontSize: 10,
    color: '#999999',
    textAlign: 'center',
    fontFamily: 'Helvetica-Oblique',
  },
  decorative: {
    width: 60,
    height: 4,
    backgroundColor: '#4CAF50',
    marginBottom: 20,
  },
  organizationName: {
    fontSize: 12,
    color: '#0F9B8E',
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 2,
    marginBottom: 8,
  },
});

export default function CertificateTemplate({ certificate }) {
  const { profiles: profile, courses, modules, certificate_number, issued_at } = certificate;
  const resourceTitle = courses?.title || modules?.title || 'Discipleship Course';

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.border}>
          <View style={styles.header}>
            <Text style={styles.headerText}>GRACEWAY GENERATION</Text>
          </View>

          <Text style={styles.title}>Certificate of Completion</Text>

          <View style={styles.decorative} />

          <Text style={styles.subtitle}>This is to certify that</Text>

          <Text style={styles.name}>{profile?.name || 'Student'}</Text>

          <Text style={styles.subtitle}>has successfully completed</Text>

          <Text style={styles.courseTitle}>{resourceTitle}</Text>

          <Text style={styles.subtitle}>with excellence in digital discipleship training</Text>

          <Text style={styles.organizationName}>GRACEWAY GENERATION PLATFORM</Text>

          <Text style={styles.date}>
            Issued on {formatDate(issued_at)}
          </Text>

          <Text style={styles.certNumber}>
            Certificate No: {certificate_number}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
