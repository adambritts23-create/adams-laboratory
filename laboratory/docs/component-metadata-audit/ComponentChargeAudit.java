import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import lib.common.Util;
import lib.database.Complex;
class ComponentChargeAudit {
 public static void main(String[] args) throws Exception {
  for(String name:Files.readAllLines(Path.of(args[0]),StandardCharsets.UTF_8))System.out.println(name+"\t"+Util.chargeOf(name));
  Complex c=new Complex();c.name="HAc";c.reactionComp.add("CH3COO-");c.reactionComp.add("H+");c.reactionCoef.add(1.0);c.reactionCoef.add(1.0);
  System.out.println("CHECK_balanced\t"+c.isChargeBalanced());
  c.reactionCoef.set(1,2.0);System.out.println("CHECK_unbalanced\t"+c.isChargeBalanced());
 }
}
