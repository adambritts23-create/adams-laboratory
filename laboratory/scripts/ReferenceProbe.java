import java.io.*;
import java.util.Arrays;
import lib.kemi.chem.Chem;
import lib.kemi.readDataLib.ReadDataLib;
import lib.kemi.readWriteDataFiles.ReadChemSyst;
import lib.kemi.haltaFall.Factor;
import lib.kemi.haltaFall.HaltaFall;

/** Test-only adapter to the unchanged official library. No numerical algorithm here. */
public class ReferenceProbe {
  public static void main(String[] args) throws Exception {
    ByteArrayOutputStream messages = new ByteArrayOutputStream();
    PrintStream log = new PrintStream(messages, true, "UTF-8");
    ReadDataLib reader = new ReadDataLib(new File(args[0]));
    Chem chem = ReadChemSyst.readChemSyst(reader, false, log);
    Chem.ChemSystem cs = chem.chemSystem;
    Chem.ChemSystem.ChemConcs c = cs.chemConcs;
    if (reader.readI() != 1) throw new IllegalArgumentException("Probe expects one fixed point");
    for (int i=0; i<cs.Na; i++) {
      String mode = reader.readA();
      double value = reader.readD();
      if (mode.equals("T")) { c.kh[i]=1; c.tot[i]=value; }
      else if (mode.equals("LA")) { c.kh[i]=2; c.logA[i]=value; }
      else throw new IllegalArgumentException("Probe supports only T and LA");
    }
    reader.close();
    c.temperature=25; c.pressure=1; c.activityCoeffsModel=-1; c.ionicStr=0;
    c.tol=Double.parseDouble(args[1]); c.dbg=0; c.cont=false;
    Factor factor = new Factor(chem, null, null, null, log);
    HaltaFall solver = new HaltaFall(cs, factor, log);
    solver.haltaCalc();
    System.out.println("{\"errFlags\":"+c.errFlags+",\"concentration\":"+Arrays.toString(c.C)+",\"logActivity\":"+Arrays.toString(c.logA)+",\"total\":"+Arrays.toString(c.tot)+",\"dissolved\":"+Arrays.toString(c.solub)+",\"logActivityCoefficient\":"+Arrays.toString(c.logf)+"}");
    if (c.errFlags != 0) throw new IllegalStateException("Official solver flags: "+c.errFlags+" "+messages.toString("UTF-8"));
  }
}
