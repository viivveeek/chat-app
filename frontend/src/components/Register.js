import React, { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate, Link } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Stack,
  IconButton,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

const registerSchema = Yup.object({
  username: Yup.string()
    .min(3, "Min 3 chars")
    .max(30, "Max 30 chars")
    .required("Username required"),
  email: Yup.string().email("Invalid email").required("Email required"),
  password: Yup.string().min(6, "Min 6 chars").required("Password required"),
});

const Register = () => {
  const { login, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const formik = useFormik({
    initialValues: {
      username: "",
      email: "",
      password: "",
    },
    validationSchema: registerSchema,
    onSubmit: async (values, { setSubmitting, setFieldError }) => {
      try {
        const res = await axios.post(
          "https://chat-app-eo5m.onrender.com/api/auth/register",
          values,
        );

        login(res.data.user, res.data.token);

        // small delay for UX
        setTimeout(() => navigate("/"), 500);
      } catch (err) {
        setFieldError(
          "general",
          err.response?.data?.error || "Registration failed",
        );
      } finally {
        setSubmitting(false);
      }
    },
  });

  if (authLoading) return <CircularProgress />;

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #667eea, #764ba2)",
        }}
      >
        <Paper
          elevation={6}
          sx={{
            p: 4,
            width: "100%",
            borderRadius: 3,
            backdropFilter: "blur(10px)",
          }}
        >
          <Typography
            variant="h4"
            align="center"
            gutterBottom
            fontWeight="bold"
          >
            jarvis
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            mb={2}
          >
            Create your account and start chatting securely
          </Typography>

          {formik.errors.general && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formik.errors.general}
            </Alert>
          )}

          <Box component="form" onSubmit={formik.handleSubmit}>
            <TextField
              fullWidth
              margin="normal"
              label="Username"
              name="username"
              value={formik.values.username}
              onChange={formik.handleChange}
              error={formik.touched.username && Boolean(formik.errors.username)}
              helperText={formik.touched.username && formik.errors.username}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Email"
              name="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formik.values.password}
              onChange={formik.handleChange}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 3,
                py: 1.3,
                borderRadius: 2,
                fontWeight: "bold",
              }}
              disabled={formik.isSubmitting}
            >
              {formik.isSubmitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Create Account"
              )}
            </Button>

            <Stack mt={2} alignItems="center">
              <Link to="/login">Already have an account? Sign In</Link>
            </Stack>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;
