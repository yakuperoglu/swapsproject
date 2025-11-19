import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  Chip,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Dashboard as DashboardIcon,
  EmojiObjects as SkillIcon,
  ExpandMore as ExpandMoreIcon,
  Add,
} from '@mui/icons-material';
import authService from '../services/authService';
import skillsService from '../services/skillsService';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm, setEditForm] = useState({ username: '', email: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [currentTab, setCurrentTab] = useState(0);
  const [skillDialogOpen, setSkillDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: '', category: '' });
  const [newCategory, setNewCategory] = useState('');
  const [availableCategories, setAvailableCategories] = useState([]);
  const [skillsByCategory, setSkillsByCategory] = useState({});

  useEffect(() => {
    // Admin kontrolü
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'admin') {
      navigate('/login');
      return;
    }

    loadSkills();
    fetchUsers();
  }, [navigate]);

  const loadSkills = async () => {
    try {
      // API'den yetenekleri yükle
      await skillsService.getAllSkills();
      // Sonra kategorilere göre grupla
      const grouped = skillsService.getSkillsByCategory();
      setSkillsByCategory(grouped);
      
      // Kategorileri de yükle
      const categories = await skillsService.getAllCategories();
      setAvailableCategories(categories);
    } catch (error) {
      console.error('Yetenekler yüklenemedi:', error);
      // Hata olsa bile cache'den yükle
      const grouped = skillsService.getSkillsByCategory();
      setSkillsByCategory(grouped);
      
      const categories = skillsService.getAllCategoriesSync();
      setAvailableCategories(categories);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    const result = await authService.getAllUsers();
    if (result.success) {
      setUsers(result.data.users || []);
    } else {
      setSnackbar({
        open: true,
        message: 'Kullanıcılar yüklenemedi: ' + result.error,
        severity: 'error',
      });
    }
    setLoading(false);
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setEditForm({ username: user.username, email: user.email });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedUser) return;

    const result = await authService.updateUser(selectedUser.id, editForm);
    if (result.success) {
      setSnackbar({
        open: true,
        message: 'Kullanıcı başarıyla güncellendi!',
        severity: 'success',
      });
      fetchUsers();
      setEditDialogOpen(false);
    } else {
      setSnackbar({
        open: true,
        message: 'Hata: ' + result.error,
        severity: 'error',
      });
    }
  };

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;

    const result = await authService.deleteUser(selectedUser.id);
    if (result.success) {
      setSnackbar({
        open: true,
        message: 'Kullanıcı başarıyla silindi!',
        severity: 'success',
      });
      fetchUsers();
      setDeleteDialogOpen(false);
    } else {
      setSnackbar({
        open: true,
        message: 'Hata: ' + result.error,
        severity: 'error',
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleAddSkill = async () => {
    if (!newSkill.name.trim() || !newSkill.category.trim()) {
      setSnackbar({
        open: true,
        message: 'Lütfen yetenek adı ve kategori seçin!',
        severity: 'warning',
      });
      return;
    }

    const result = await skillsService.addSkill(newSkill.name.trim(), newSkill.category.trim());
    
    if (result.success) {
      await loadSkills(); // Yetenekleri yeniden yükle
      setSnackbar({
        open: true,
        message: 'Yetenek başarıyla eklendi ve veritabanına kaydedildi!',
        severity: 'success',
      });
      setNewSkill({ name: '', category: '' });
      setSkillDialogOpen(false);
    } else {
      setSnackbar({
        open: true,
        message: result.error,
        severity: 'error',
      });
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      setSnackbar({
        open: true,
        message: 'Lütfen kategori adı girin!',
        severity: 'warning',
      });
      return;
    }

    // Kategori zaten var mı kontrol et
    if (availableCategories.includes(newCategory.trim())) {
      setSnackbar({
        open: true,
        message: 'Bu kategori zaten mevcut!',
        severity: 'error',
      });
      return;
    }

    // Kategorileri güncelle
    const updatedCategories = [...availableCategories, newCategory.trim()].sort();
    setAvailableCategories(updatedCategories);
    
    setSnackbar({
      open: true,
      message: `"${newCategory.trim()}" kategorisi eklendi! Şimdi bu kategoride yetenek ekleyebilirsiniz.`,
      severity: 'success',
    });
    
    setNewCategory('');
    setCategoryDialogOpen(false);
  };

  const handleDeleteSkill = async (skillName, category) => {
    const result = await skillsService.deleteSkill(skillName, category);
    
    if (result.success) {
      await loadSkills(); // Yetenekleri yeniden yükle
      setSnackbar({
        open: true,
        message: 'Yetenek silindi ve veritabanından kaldırıldı!',
        severity: 'success',
      });
    } else {
      setSnackbar({
        open: true,
        message: result.error,
        severity: 'error',
      });
    }
  };

  const getTotalSkillsCount = () => {
    return Object.values(skillsByCategory).reduce((sum, skills) => sum + skills.length, 0);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'var(--primary-gradient)',
        py: 4,
      }}
    >
      <Container maxWidth="xl">
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <DashboardIcon sx={{ fontSize: 40, color: 'white' }} />
            <Typography variant="h3" sx={{ fontWeight: 700, color: 'white' }}>
              Admin Panel
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{
              background: 'rgba(255, 255, 255, 0.2)',
              '&:hover': { background: 'rgba(255, 255, 255, 0.3)' },
            }}
          >
            Çıkış Yap
          </Button>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <PersonIcon sx={{ fontSize: 50, color: 'var(--primary-accent)' }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {users.length}
                    </Typography>
                    <Typography color="textSecondary">Toplam Kullanıcı</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <SkillIcon sx={{ fontSize: 50, color: 'var(--secondary-color)' }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {getTotalSkillsCount()}
                    </Typography>
                    <Typography color="textSecondary">Toplam Yetenek</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={currentTab}
            onChange={(e, newValue) => setCurrentTab(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Kullanıcılar" />
            <Tab label="Yetenekler" />
          </Tabs>
        </Paper>

        {/* Kullanıcılar Tabı */}
        {currentTab === 0 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
              Kullanıcı Yönetimi
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>ID</strong></TableCell>
                    <TableCell><strong>Kullanıcı Adı</strong></TableCell>
                    <TableCell><strong>Email</strong></TableCell>
                    <TableCell align="right"><strong>İşlemler</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        Yükleniyor...
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        Henüz kullanıcı yok
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id} hover>
                        <TableCell>{user.id}</TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            color="primary"
                            onClick={() => handleEditClick(user)}
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => handleDeleteClick(user)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* Yetenekler Tabı */}
        {currentTab === 1 && (
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Yetenek Yönetimi
              </Typography>
              <Button
                variant="contained"
                startIcon={<SkillIcon />}
                onClick={() => setSkillDialogOpen(true)}
                sx={{
                  background: 'var(--primary-gradient)',
                }}
              >
                Yeni Yetenek Ekle
              </Button>
            </Box>

            {Object.keys(skillsByCategory).length === 0 ? (
              <Typography variant="body1" color="textSecondary" align="center" sx={{ py: 4 }}>
                Henüz yetenek eklenmemiş
              </Typography>
            ) : (
              Object.keys(skillsByCategory).map((category) => (
                <Accordion key={category} defaultExpanded sx={{ mb: 2 }}>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      backgroundColor: '#f5f5f5',
                      '&:hover': { backgroundColor: '#eeeeee' },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {category}
                      </Typography>
                      <Chip
                        label={`${skillsByCategory[category].length} yetenek`}
                        size="small"
                        color="primary"
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      {skillsByCategory[category].map((skill, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                          <Box
                            sx={{
                              p: 2,
                              border: '1px solid #ddd',
                              borderRadius: 2,
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              '&:hover': {
                                borderColor: 'var(--primary-accent)',
                                backgroundColor: '#f0f6ff',
                              },
                            }}
                          >
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {skill.name}
                            </Typography>
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => handleDeleteSkill(skill.name, skill.category)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              ))
            )}
          </Paper>
        )}

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Kullanıcıyı Düzenle</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Kullanıcı Adı"
              value={editForm.username}
              onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
              sx={{ mt: 2, mb: 2 }}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>İptal</Button>
            <Button onClick={handleEditSubmit} variant="contained">
              Kaydet
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Kullanıcıyı Sil</DialogTitle>
          <DialogContent>
            <Typography>
              {selectedUser?.username} kullanıcısını silmek istediğinizden emin misiniz?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>İptal</Button>
            <Button onClick={handleDeleteConfirm} variant="contained" color="error">
              Sil
            </Button>
          </DialogActions>
        </Dialog>

        {/* Skill Dialog */}
        <Dialog open={skillDialogOpen} onClose={() => setSkillDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Yeni Yetenek Ekle</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Yetenek Adı"
              value={newSkill.name}
              onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
              sx={{ mt: 2, mb: 2 }}
              placeholder="Örn: Rust, Korece, Bateri"
            />
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <FormControl fullWidth>
                <InputLabel>Kategori</InputLabel>
                <Select
                  value={newSkill.category}
                  label="Kategori"
                  onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}
                >
                  {availableCategories.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                onClick={() => setCategoryDialogOpen(true)}
                sx={{
                  minWidth: 'auto',
                  px: 2,
                  height: 56,
                  borderColor: 'var(--primary-accent)',
                  color: 'var(--primary-accent)',
                  '&:hover': {
                    borderColor: 'var(--secondary-color)',
                    backgroundColor: 'rgba(37, 99, 235, 0.08)',
                  },
                }}
                title="Yeni Kategori Ekle"
              >
                <Add />
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSkillDialogOpen(false)}>İptal</Button>
            <Button onClick={handleAddSkill} variant="contained">
              Ekle
            </Button>
          </DialogActions>
        </Dialog>

        {/* Category Dialog */}
        <Dialog open={categoryDialogOpen} onClose={() => setCategoryDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Yeni Kategori Ekle</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Kategori Adı"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              sx={{ mt: 2 }}
              placeholder="Örn: Spor, Sanat, Bilim"
              autoFocus
            />
            <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
              Bu kategori altında yetenekler ekleyebilirsiniz.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCategoryDialogOpen(false)}>İptal</Button>
            <Button onClick={handleAddCategory} variant="contained">
              Ekle
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default AdminPanel;

