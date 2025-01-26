import { changeUserPassword } from "@/app/actions/auth/authAction";
import { useToast } from "@/hooks/use-toast";
import { logError } from "@/services/Error/ErrorLogs";
import { ROLE } from "@/utils/constant";
import { useRole } from "@/utils/context/roleContext";
import { createClientSide } from "@/utils/supabase/client";
import { UserRequestdata } from "@/utils/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { PasswordInput } from "../ui/passwordInput";

const generateRandomPassword = (length: number = 12) => {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
  return Array.from(
    { length },
    () => charset[Math.floor(Math.random() * charset.length)]
  ).join("");
};

const ChangePasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z
      .string()
      .min(6, "Confirm Password must be at least 6 characters"),
  })
  .superRefine(({ confirmPassword, password }, ctx) => {
    if (confirmPassword !== password) {
      ctx.addIssue({
        code: "custom",
        message: "The passwords did not match",
        path: ["confirmPassword"],
      });
    }
  });

type ChangePasswordFormValues = z.infer<typeof ChangePasswordSchema>;

type Props = {
  userProfile: UserRequestdata;
  setUserProfile?: Dispatch<SetStateAction<UserRequestdata>>;
};

const ChangePassword = ({ userProfile, setUserProfile }: Props) => {
  const { toast } = useToast();
  const { role } = useRole();
  const supabaseClient = createClientSide();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ChangePasswordFormValues) => {
    try {
      await changeUserPassword({
        userId: userProfile.user_id,
        email: userProfile.user_email,
        password: data.password,
      });

      reset();
      if (setUserProfile) {
        setUserProfile((prev) => ({
          ...prev,
        }));
      }
      toast({
        title: "Password Change Successfully",
        variant: "success",
      });
    } catch (e) {
      if (e instanceof Error) {
        await logError(supabaseClient, {
          errorMessage: e.message,
          stackTrace: e.stack,
          stackPath: "components/UserAdminProfile/ChangePassword.tsx",
        });
      }
      toast({
        title: "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const generatePassword = () => {
    if (role === ROLE.ADMIN) {
      const autoGeneratedPassword = generateRandomPassword();
      setValue("password", autoGeneratedPassword);
      setValue("confirmPassword", autoGeneratedPassword);

      navigator.clipboard.writeText(autoGeneratedPassword);

      toast({
        title: "Password Copied to Clipboard",
        variant: "success",
      });
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2 justify-between">
          Change Password
          {role === ROLE.ADMIN && (
            <Button variant="outline" onClick={generatePassword}>
              Generate Password
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 pt-4 gap-4"
        >
          {/* Password */}
          <div>
            <Label className="text-sm font-medium ">New Password</Label>
            <PasswordInput
              id="password"
              className="mt-1 border-gray-300"
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                },
              })}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <Label className="text-sm font-medium ">Confirm New Password</Label>
            <PasswordInput
              id="confirmPassword"
              className="mt-1 border-gray-300"
              {...register("confirmPassword", {
                required: "Confirmation is required",
              })}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button disabled={isSubmitting} type="submit" className="w-full">
            {isSubmitting && <Loader2 className="animate-spin" />}
            Save Changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ChangePassword;
